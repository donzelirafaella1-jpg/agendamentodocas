# Move Log TMS - Sistema Integrado de Gestão de Transporte, Pátio e Docas

O **Move Log TMS** é um sistema web corporativo, de nível de produção, desenvolvido sob medida para a operação logística do Centro de Distribuição (CD) da **Move Log** (Louveira / Cajamar - SP). O sistema gerencia ponta a ponta o ciclo de 32 caminhões diários em suas 14 docas e 8 vagas simultâneas no pátio.

---

## 🚚 Regras de Negócio e Parâmetros Operacionais

1. **Volume Diário**: Capacidade nominal de recebimento e expedição de **32 caminhões/dia**.
2. **Capacidade do Pátio**: Máximo de **8 veículos simultaneamente** no pátio.
   - A capacidade é calculada rigorosamente pela **sobreposição dos períodos de permanência** (janela de agendamento + tempo estimado de manobra e espera).
   - Bloqueio automático de agendamento caso a sobreposição em qualquer minuto atinja o teto de 8 veículos.
   - Mensagem exibida:
     > *“Horário indisponível. A capacidade máxima do pátio será atingida neste período.”*
   - Sugestão imediata de horários alternativos onde a taxa de sobreposição seja inferior a 8.
   - Liberações manuais em situação de sobrecarga exigem **confirmação formal com justificativa** e geram registro na trilha de auditoria.
3. **Turnos de Operação**:
   - **Turno 1 (Manhã)**: 07:00 às 11:00
   - **Intervalo de Almoço (Obrigatório)**: 11:00 às 12:00 (**Estritamente Bloqueado**)
   - **Turno 2 (Tarde)**: 12:00 às 16:00
4. **Gestão das 14 Docas**:
   - Bloqueio anti-conflito: não permite dois caminhões na mesma doca ao mesmo tempo.
   - Especialização por carga: Docas 01 e 02 climatizadas (perecíveis), Docas 13 e 14 para cargas industriais pesadas.
5. **Fluxo Operacional Completo**:
   `Agendamento` ➔ `Chegada` ➔ `Check-in` ➔ `Entrada no Pátio (Vagas P-01 a P-08)` ➔ `Fila de Espera` ➔ `Alocação de Doca (01 a 14)` ➔ `Descarregamento` ➔ `Finalização` ➔ `Saída do CD`.

---

## 🏛️ Arquitetura e Estrutura de Pastas

```text
/
├── src/
│   ├── assets/images/              # Imagens e marcas visuais da Move Log
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Cabeçalho com relógio simulado e troca de perfil
│   │   │   └── Sidebar.tsx         # Navegação lateral com contadores ao vivo
│   │   ├── dashboard/
│   │   │   └── DashboardView.tsx   # Visão geral, gauges do pátio e docas, SLAs
│   │   ├── appointments/
│   │   │   ├── AppointmentsView.tsx# Tabela e filtros de agendamentos
│   │   │   ├── NewAppointmentModal.tsx # Modal com validação de sobreposição
│   │   │   └── OverrideConfirmModal.tsx# Confirmação de sobrecarga com justificativa
│   │   ├── schedule/
│   │   │   └── ScheduleView.tsx    # Agenda diária e semanal com timeline
│   │   ├── optimizer/
│   │   │   └── OptimizerView.tsx   # Algoritmo de otimização dos 32 caminhões
│   │   ├── yard/
│   │   │   └── YardView.tsx        # Controle visual das 8 posições de pátio
│   │   ├── docks/
│   │   │   └── DocksView.tsx       # Gerenciamento em tempo real das 14 docas
│   │   ├── queue/
│   │   │   └── QueueView.tsx       # Fila de espera dinâmica (FIFO + Prioridades)
│   │   ├── checkin/
│   │   │   └── CheckInView.tsx     # Portaria com cálculo de atrasos/antecipação
│   │   ├── carriers/
│   │   │   └── CarriersView.tsx    # Transportadoras reais e motoristas cadastrados
│   │   ├── reports/
│   │   │   └── ReportsView.tsx     # Indicadores, Manhã x Tarde, exportação CSV
│   │   └── settings/
│   │       └── SettingsView.tsx    # Parâmetros, multi-tenant e auditoria
│   ├── context/
│   │   └── TMSContext.tsx          # Store reativo central com controle RBAC
│   ├── db/
│   │   └── schema.sql              # Esquema relacional PostgreSQL de produção
│   ├── services/
│   │   ├── db.ts                   # Camada de persistência e dataset inicial (32 caminhões)
│   │   ├── yardCapacityService.ts  # Algoritmo de sobreposição minuto a minuto
│   │   ├── optimizerService.ts     # Balanceador heurístico de docas e horários
│   │   └── reportService.ts        # Métricas estatísticas e exportador CSV
│   ├── types/
│   │   └── index.ts                # Modelos TypeScript completos
│   ├── App.tsx                     # Ponto de entrada da aplicação
│   ├── main.tsx                    # Montagem React 19
│   └── index.css                   # Tailwind CSS
├── metadata.json
├── package.json
└── tsconfig.json
```

---

## 👥 Perfis de Acesso (RBAC)

O sistema conta com seletor instantâneo de perfis no cabeçalho:
- **Administrador**: Controle irrestrito de parâmetros, docas, pátio e auditoria.
- **Gestor Logístico**: Agendamentos, Otimizador de Agenda, liberação de sobrecarga e relatórios analíticos.
- **Operador de Pátio**: Portaria de entrada, conferência de check-in, manobras entre vagas P-01 a P-08 e retenção em fila.
- **Operador de Doca**: Operação das docas 01 a 14, cronômetro de descarga, pausas e finalizações.
- **Somente Leitura**: Consulta e auditoria de dados e relatórios sem permissão de edição.

---

## ⚡ Como Executar o Projeto

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Compilar e gerar build de produção
npm run build
```

O sistema inicializa automaticamente com 32 caminhões agendados, refletindo o cenário dinâmico do CD com veículos em doca, no pátio, na fila e agendados para a tarde. O botão de restauração rápida permite reiniciar os dados de teste a qualquer momento.
