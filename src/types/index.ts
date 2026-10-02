/**
 * Move Log TMS - Core Type Definitions
 * Complete domain models for logistics, yard, dock, appointments, and audit
 */

export type UserRole = 
  | 'ADMIN' 
  | 'GESTOR_LOGISTICO' 
  | 'OPERADOR_PATIO' 
  | 'OPERADOR_DOCA' 
  | 'SOMENTE_LEITURA';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarUrl?: string;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  cnpj: string;
  city: string;
  state: string;
  distributionCenterName: string;
  isDefault: boolean;
}

export type AppointmentStatus =
  | 'AGENDADO'
  | 'CHEGADA_REGISTRADA'
  | 'NO_PATIO'
  | 'NA_FILA'
  | 'EM_DOCA'
  | 'DESCARREGANDO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type PriorityLevel = 
  | 'BAIXA' 
  | 'NORMAL' 
  | 'ALTA' 
  | 'URGENTE_PERECIVEL' 
  | 'FARMA_CONTROLADO';

export type CargoType = 
  | 'Carga Geral'
  | 'Alimentos Secos'
  | 'Perecíveis Refrigerados'
  | 'Farmacêuticos'
  | 'Eletrônicos & Alto Valor'
  | 'Peças Industriais'
  | 'Bebidas & Embalagens';

export type VehicleType = 
  | 'Carreta LS' 
  | 'Carreta Baú' 
  | 'Truck' 
  | 'Bitrem' 
  | 'Toco' 
  | 'VUC';

export interface Carrier {
  id: string;
  cnpj: string;
  name: string;
  tradeName: string;
  phone: string;
  email: string;
  punctualityRate: number; // 0 to 100%
  completedDeliveries: number;
}

export interface Driver {
  id: string;
  carrierId: string;
  name: string;
  cpf: string;
  cnh: string;
  cnhCategory: string;
  phone: string;
  avatarUrl?: string;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  plate: string; // Mercosul format (ex: BRA2E19)
  type: VehicleType;
  capacityTon: number;
  model: string;
}

export interface Appointment {
  id: string;
  code: string; // e.g. AG-2026-001
  companyId: string;
  date: string; // YYYY-MM-DD
  windowStart: string; // "HH:MM" e.g. "08:00"
  windowEnd: string; // "HH:MM" e.g. "08:50"
  estimatedDurationMinutes: number; // Unloading duration e.g. 50 min
  estimatedStayMinutes: number; // Total yard dwell e.g. 65 min
  status: AppointmentStatus;
  priority: PriorityLevel;
  cargoType: CargoType;
  cargoWeightKg: number;
  carrierId: string;
  driverId: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  invoiceNumber: string; // NF-e
  assignedDockId?: number; // 1 to 14
  assignedYardSlotId?: number; // 1 to 8
  
  // Timestamps / Tracking
  scheduledTime: string; // "HH:MM"
  actualCheckInTime?: string;
  actualYardEntryTime?: string;
  actualDockEntryTime?: string;
  unloadingStartTime?: string;
  unloadingEndTime?: string;
  actualDepartureTime?: string;
  
  // Real-time variance (delay or early arrival)
  delayMinutes?: number; // +25 = atrasado 25 min; -15 = antecipado 15 min; 0 = pontual
  delayCategory?: 'PONTUAL' | 'ATRASADO' | 'ANTECIPADO';
  
  // Overbooking / Manual override tracking
  isManualOverride?: boolean;
  overrideJustification?: string;
  overrideAuthor?: string;
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DockStatus = 
  | 'LIVRE' 
  | 'AGUARDANDO_VEICULO' 
  | 'EM_OPERACAO' 
  | 'MANUTENCAO';

export interface Dock {
  id: number; // 1 to 14
  name: string; // "Doca 01" to "Doca 14"
  status: DockStatus;
  currentAppointmentId?: string;
  cargoSpecialty: string; // e.g., "Refrigerados / Perecíveis", "Carga Geral", "Pesados"
  isMaintenance: boolean;
  maintenanceReason?: string;
  startedOperationAt?: string;
  estimatedCompletionAt?: string;
  progressPercentage: number; // 0 to 100
}

export interface YardSlot {
  id: number; // 1 to 8
  name: string; // "Vaga P-01" to "Vaga P-08"
  isOccupied: boolean;
  currentAppointmentId?: string;
  parkedSince?: string;
}

export interface WaitingQueueItem {
  id: string;
  appointmentId: string;
  enteredAt: string;
  priority: PriorityLevel;
  queuePosition: number;
  reason: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'AGENDAMENTO' | 'PATIO' | 'DOCA' | 'CHECKIN' | 'CONFIG' | 'OTIMIZACAO';
  entityId: string;
  details: string;
  isOverrideAlert?: boolean;
  overrideReason?: string;
  previousValue?: string;
  newValue?: string;
}

export interface SystemConfig {
  shift1Start: string; // "07:00"
  shift1End: string; // "11:00"
  lunchBlockStart: string; // "11:00"
  lunchBlockEnd: string; // "12:00"
  shift2Start: string; // "12:00"
  shift2End: string; // "16:00"
  maxYardCapacity: number; // 8
  totalDocks: number; // 14
  dailyTruckTarget: number; // 32
  companyName: string;
  activeDistributionCenter: string;
}

export interface CapacityCheckResult {
  isValid: boolean;
  isBlockedLunchTime: boolean;
  isYardFull: boolean;
  peakOccupancy: number;
  maxAllowed: number;
  message: string;
  suggestedAlternativeSlots: string[];
}

export interface OptimizationResult {
  originalAppointments: Appointment[];
  optimizedAppointments: Appointment[];
  trucksCount: number;
  beforeMetrics: {
    peakYardOccupancy: number;
    estimatedWaitTimeAvg: number;
    dockConflicts: number;
    lunchViolations: number;
  };
  afterMetrics: {
    peakYardOccupancy: number;
    estimatedWaitTimeAvg: number;
    dockConflicts: number;
    lunchViolations: number;
  };
  changes: {
    appointmentId: string;
    code: string;
    vehiclePlate: string;
    carrierName: string;
    oldTime: string;
    newTime: string;
    oldDock?: number;
    newDock?: number;
    reason: string;
  }[];
}
