-- ==============================================================================
-- Move Log TMS - PostgreSQL Database Schema
-- Centro de Distribuição Move Log (CD Louveira / Cajamar SP)
-- Suporte a Múltiplas Empresas (Multi-Tenant Ready)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Empresas (Multi-tenant structure)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    distribution_center_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários e Perfis de Acesso
CREATE TYPE user_role_enum AS ENUM (
    'ADMIN',
    'GESTOR_LOGISTICO',
    'OPERADOR_PATIO',
    'OPERADOR_DOCA',
    'SOMENTE_LEITURA'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'OPERADOR_PATIO',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transportadoras
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    punctuality_rate NUMERIC(5,2) DEFAULT 100.00,
    completed_deliveries INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Motoristas
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    cnh VARCHAR(20) NOT NULL UNIQUE,
    cnh_category VARCHAR(5) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE RESTRICT,
    plate VARCHAR(10) NOT NULL UNIQUE, -- Placa Mercosul / Padrão Antigo
    vehicle_type VARCHAR(50) NOT NULL, -- Carreta LS, Truck, Bitrem, Toco, VUC
    model VARCHAR(100) NOT NULL,
    capacity_tons NUMERIC(5,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Posições de Pátio (8 vagas simultâneas no CD Move Log)
CREATE TABLE IF NOT EXISTS yard_slots (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 8),
    name VARCHAR(20) NOT NULL, -- 'Vaga P-01' a 'Vaga P-08'
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    current_appointment_id UUID,
    parked_since TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_company_slot UNIQUE (company_id, slot_number)
);

-- 7. Docas (14 docas no CD Move Log)
CREATE TYPE dock_status_enum AS ENUM (
    'LIVRE',
    'AGUARDANDO_VEICULO',
    'EM_OPERACAO',
    'MANUTENCAO'
);

CREATE TABLE IF NOT EXISTS dock_locations (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    dock_number INTEGER NOT NULL CHECK (dock_number BETWEEN 1 AND 14),
    name VARCHAR(20) NOT NULL, -- 'Doca 01' a 'Doca 14'
    status dock_status_enum NOT NULL DEFAULT 'LIVRE',
    cargo_specialty VARCHAR(100) NOT NULL, -- e.g. Refrigerados, Geral, Paletizado
    is_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_reason TEXT,
    current_appointment_id UUID,
    started_operation_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_company_dock UNIQUE (company_id, dock_number)
);

-- 8. Agendamentos
CREATE TYPE appointment_status_enum AS ENUM (
    'AGENDADO',
    'CHEGADA_REGISTRADA',
    'NO_PATIO',
    'NA_FILA',
    'EM_DOCA',
    'DESCARREGANDO',
    'FINALIZADO',
    'CANCELADO'
);

CREATE TYPE priority_enum AS ENUM (
    'BAIXA',
    'NORMAL',
    'ALTA',
    'URGENTE_PERECIVEL',
    'FARMA_CONTROLADO'
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL UNIQUE, -- e.g. AG-2026-001
    appointment_date DATE NOT NULL,
    window_start TIME NOT NULL, -- ex: '08:00:00'
    window_end TIME NOT NULL,   -- ex: '08:50:00'
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 50,
    estimated_stay_minutes INTEGER NOT NULL DEFAULT 65,
    status appointment_status_enum NOT NULL DEFAULT 'AGENDADO',
    priority priority_enum NOT NULL DEFAULT 'NORMAL',
    cargo_type VARCHAR(100) NOT NULL,
    cargo_weight_kg NUMERIC(10,2) NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    vehicle_plate VARCHAR(10) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    
    assigned_dock_id INTEGER REFERENCES dock_locations(id),
    assigned_yard_slot_id INTEGER REFERENCES yard_slots(id),
    
    -- Marcos Temporais Reais (Timestamps)
    actual_check_in_time TIMESTAMP WITH TIME ZONE,
    actual_yard_entry_time TIMESTAMP WITH TIME ZONE,
    actual_dock_entry_time TIMESTAMP WITH TIME ZONE,
    unloading_start_time TIMESTAMP WITH TIME ZONE,
    unloading_end_time TIMESTAMP WITH TIME ZONE,
    actual_departure_time TIMESTAMP WITH TIME ZONE,
    
    -- Desvios
    delay_minutes INTEGER DEFAULT 0,
    delay_category VARCHAR(20) DEFAULT 'PONTUAL',
    
    -- Validação de Capacidade & Liberação Manual
    is_manual_override BOOLEAN DEFAULT FALSE,
    override_justification TEXT,
    override_author VARCHAR(150),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Regra de negócio: Operação das 07:00 às 16:00
    CONSTRAINT check_operational_hours CHECK (
        window_start >= '07:00:00' AND window_end <= '16:00:00'
    ),
    -- Regra de negócio: Intervalo 11:00 às 12:00 obrigatoriamente bloqueado
    CONSTRAINT check_lunch_interval_block CHECK (
        NOT (window_start < '12:00:00' AND window_end > '11:00:00')
    )
);

-- 9. Check-ins de Portaria
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    operator_user_id UUID NOT NULL REFERENCES users(id),
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    driver_cnh_verified BOOLEAN NOT NULL DEFAULT TRUE,
    seal_number VARCHAR(50),
    odometer_km INTEGER,
    checklist_notes TEXT,
    delay_detected_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Fila de Espera Dinâmica
CREATE TABLE IF NOT EXISTS waiting_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    entered_queue_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    priority priority_enum NOT NULL DEFAULT 'NORMAL',
    queue_position INTEGER NOT NULL,
    wait_reason VARCHAR(150) NOT NULL,
    called_to_dock_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Auditoria e Logs do Sistema (Rastreabilidade Completa)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(150) NOT NULL,
    user_role user_role_enum NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    is_override_alert BOOLEAN NOT NULL DEFAULT FALSE,
    override_reason TEXT,
    previous_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Configurações Operacionais do CD
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift1_start TIME NOT NULL DEFAULT '07:00:00',
    shift1_end TIME NOT NULL DEFAULT '11:00:00',
    lunch_start TIME NOT NULL DEFAULT '11:00:00',
    lunch_end TIME NOT NULL DEFAULT '12:00:00',
    shift2_start TIME NOT NULL DEFAULT '12:00:00',
    shift2_end TIME NOT NULL DEFAULT '16:00:00',
    max_yard_capacity INTEGER NOT NULL DEFAULT 8,
    total_docks INTEGER NOT NULL DEFAULT 14,
    daily_truck_target INTEGER NOT NULL DEFAULT 32,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_company_settings UNIQUE (company_id)
);

-- Índices para Performance & Escala
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_carrier ON appointments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_appointments_plate ON appointments(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_dock_locations_status ON dock_locations(status);
CREATE INDEX IF NOT EXISTS idx_yard_slots_status ON yard_slots(is_occupied);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC);
