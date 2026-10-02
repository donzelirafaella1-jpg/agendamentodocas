/**
 * Move Log TMS - Central Application Context
 * Provides reactive logistics state, operational workflow dispatchers,
 * permission checks, simulated operational clock, and audit logging.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Appointment,
  Carrier,
  Company,
  Dock,
  Driver,
  SystemConfig,
  UserProfile,
  UserRole,
  YardSlot,
  WaitingQueueItem,
  AuditLog,
  CapacityCheckResult,
} from '../types';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_CARRIERS,
  INITIAL_COMPANY,
  INITIAL_CONFIG,
  INITIAL_DOCKS,
  INITIAL_DRIVERS,
  INITIAL_PROFILES,
  INITIAL_QUEUE,
  INITIAL_YARD_SLOTS,
  INITIAL_AUDIT_LOGS,
  TODAY_STR,
  getStorageItem,
  setStorageItem,
  clearTMSStorage,
} from '../services/db';
import {
  validateAppointmentCapacity,
  timeToMinutes,
  minutesToTime,
  OPERATIONAL_LIMITS,
} from '../services/yardCapacityService';

interface TMSContextType {
  // State
  appointments: Appointment[];
  yardSlots: YardSlot[];
  docks: Dock[];
  queue: WaitingQueueItem[];
  carriers: Carrier[];
  drivers: Driver[];
  auditLogs: AuditLog[];
  config: SystemConfig;
  company: Company;
  activeProfile: UserProfile;
  availableProfiles: UserProfile[];
  currentTimeStr: string;
  isClockRunning: boolean;
  selectedDate: string;

  // Permissions helper
  hasPermission: (allowedRoles: UserRole[]) => boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  setCurrentTimeStr: (time: string) => void;
  toggleClockRunning: () => void;
  switchProfile: (role: UserRole) => void;

  // Validation
  checkCapacity: (
    startTimeStr: string,
    durationMinutes: number,
    excludeId?: string
  ) => CapacityCheckResult;

  // Operations
  createAppointment: (
    appData: Partial<Appointment>,
    isOverride?: boolean,
    overrideReason?: string
  ) => { success: boolean; message: string; appointment?: Appointment };

  updateAppointment: (
    id: string,
    appData: Partial<Appointment>,
    isOverride?: boolean,
    overrideReason?: string
  ) => { success: boolean; message: string };

  cancelAppointment: (id: string, reason: string) => void;

  performCheckIn: (
    appointmentId: string,
    notes?: string
  ) => { success: boolean; message: string; delayCategory: string; delayMinutes: number };

  assignToYardSlot: (appointmentId: string, slotId: number) => { success: boolean; message: string };
  assignToDock: (appointmentId: string, dockId: number) => { success: boolean; message: string };
  moveToQueue: (appointmentId: string, reason?: string) => void;
  startUnloading: (dockId: number) => void;
  pauseUnloading: (dockId: number, reason: string) => void;
  finishUnloading: (dockId: number) => void;
  registerDeparture: (appointmentId: string) => void;

  applyOptimization: (optimizedList: Appointment[]) => void;
  resetToInitialDemo: () => void;
  updateConfig: (newConfig: Partial<SystemConfig>) => void;
}

const TMSContext = createContext<TMSContextType | undefined>(undefined);

export const TMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State with LocalStorage persistence
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getStorageItem('appointments', INITIAL_APPOINTMENTS)
  );
  const [yardSlots, setYardSlots] = useState<YardSlot[]>(() =>
    getStorageItem('yard_slots', INITIAL_YARD_SLOTS)
  );
  const [docks, setDocks] = useState<Dock[]>(() =>
    getStorageItem('docks', INITIAL_DOCKS)
  );
  const [queue, setQueue] = useState<WaitingQueueItem[]>(() =>
    getStorageItem('queue', INITIAL_QUEUE)
  );
  const [carriers] = useState<Carrier[]>(() =>
    getStorageItem('carriers', INITIAL_CARRIERS)
  );
  const [drivers] = useState<Driver[]>(() =>
    getStorageItem('drivers', INITIAL_DRIVERS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getStorageItem('audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [config, setConfig] = useState<SystemConfig>(() =>
    getStorageItem('config', INITIAL_CONFIG)
  );
  const [company] = useState<Company>(INITIAL_COMPANY);

  // Active simulated user profile
  const [activeProfile, setActiveProfile] = useState<UserProfile>(INITIAL_PROFILES[0]); // Default to ADMIN
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  
  // Simulated operational clock (starts at 09:40 for rich morning demonstration)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('09:40');
  const [isClockRunning, setIsClockRunning] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => { setStorageItem('appointments', appointments); }, [appointments]);
  useEffect(() => { setStorageItem('yard_slots', yardSlots); }, [yardSlots]);
  useEffect(() => { setStorageItem('docks', docks); }, [docks]);
  useEffect(() => { setStorageItem('queue', queue); }, [queue]);
  useEffect(() => { setStorageItem('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { setStorageItem('config', config); }, [config]);

  // Operational simulated clock ticker: advances 1 operational minute every 6 seconds if running
  useEffect(() => {
    if (!isClockRunning) return;
    const interval = setInterval(() => {
      setCurrentTimeStr((prev) => {
        const currentM = timeToMinutes(prev);
        const nextM = currentM >= 16 * 60 ? 7 * 60 : currentM + 1;
        return minutesToTime(nextM);
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isClockRunning]);

  const toggleClockRunning = useCallback(() => {
    setIsClockRunning((prev) => !prev);
  }, []);

  const switchProfile = useCallback((role: UserRole) => {
    const found = INITIAL_PROFILES.find((p) => p.role === role);
    if (found) {
      setActiveProfile(found);
      addAuditLog({
        action: 'TROCA_PERFIL',
        entityType: 'CONFIG',
        entityId: found.id,
        details: `Sessão alternada para perfil: ${found.roleLabel} (${found.name})`,
      });
    }
  }, []);

  const hasPermission = useCallback(
    (allowedRoles: UserRole[]) => {
      if (activeProfile.role === 'ADMIN') return true;
      return allowedRoles.includes(activeProfile.role);
    },
    [activeProfile.role]
  );

  // Helper to record an audit log
  const addAuditLog = useCallback(
    (logData: {
      action: string;
      entityType: AuditLog['entityType'];
      entityId: string;
      details: string;
      isOverrideAlert?: boolean;
      overrideReason?: string;
      previousValue?: string;
      newValue?: string;
    }) => {
      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        userId: activeProfile.id,
        userName: activeProfile.name,
        userRole: activeProfile.role,
        ...logData,
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [activeProfile]
  );

  // Capacity validation wrapper
  const checkCapacity = useCallback(
    (startTimeStr: string, durationMinutes: number, excludeId?: string): CapacityCheckResult => {
      const stay = durationMinutes + 15;
      return validateAppointmentCapacity(
        selectedDate,
        startTimeStr,
        stay,
        appointments,
        excludeId
      );
    },
    [selectedDate, appointments]
  );

  // CREATE APPOINTMENT
  const createAppointment = useCallback(
    (
      appData: Partial<Appointment>,
      isOverride = false,
      overrideReason = ''
    ): { success: boolean; message: string; appointment?: Appointment } => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO'])) {
        return { success: false, message: 'Perfil não possui permissão para criar agendamentos.' };
      }

      const startTime = appData.windowStart || '08:00';
      const duration = appData.estimatedDurationMinutes || 45;
      const stay = appData.estimatedStayMinutes || (duration + 15);
      const validation = validateAppointmentCapacity(selectedDate, startTime, stay, appointments);

      // Capacity check enforcement
      if (!validation.isValid && !isOverride) {
        return {
          success: false,
          message: validation.message,
        };
      }

      const nextCodeNum = appointments.length + 1;
      const code = `AG-2026-${nextCodeNum.toString().padStart(3, '0')}`;
      const endM = timeToMinutes(startTime) + duration;
      const windowEnd = minutesToTime(endM);

      const newApp: Appointment = {
        id: `app-${Date.now()}`,
        code,
        companyId: company.id,
        date: selectedDate,
        windowStart: startTime,
        windowEnd,
        scheduledTime: startTime,
        estimatedDurationMinutes: duration,
        estimatedStayMinutes: stay,
        status: 'AGENDADO',
        priority: appData.priority || 'NORMAL',
        cargoType: appData.cargoType || 'Carga Geral',
        cargoWeightKg: appData.cargoWeightKg || 12000,
        carrierId: appData.carrierId || carriers[0].id,
        driverId: appData.driverId || drivers[0].id,
        vehiclePlate: (appData.vehiclePlate || 'ABC1D23').toUpperCase().trim(),
        vehicleType: appData.vehicleType || 'Truck',
        invoiceNumber: appData.invoiceNumber || `NFE-${Math.floor(10000 + Math.random() * 90000)}`,
        assignedDockId: appData.assignedDockId,
        isManualOverride: isOverride,
        overrideJustification: isOverride ? overrideReason : undefined,
        overrideAuthor: isOverride ? activeProfile.name : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAppointments((prev) => [...prev, newApp]);

      addAuditLog({
        action: isOverride ? 'SOBRECARGA_MANUAL_AUTORIZADA' : 'AGENDAMENTO_CRIADO',
        entityType: 'AGENDAMENTO',
        entityId: newApp.id,
        details: `Agendamento ${newApp.code} (${newApp.vehiclePlate}) cadastrado para ${newApp.windowStart}. ${
          isOverride ? `LIBERAÇÃO DE SOBRECARGA: "${overrideReason}"` : ''
        }`,
        isOverrideAlert: isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
      });

      return {
        success: true,
        message: isOverride
          ? 'Agendamento com sobrecarga manual autorizado e registrado no histórico de auditoria!'
          : 'Agendamento cadastrado com sucesso!',
        appointment: newApp,
      };
    },
    [hasPermission, selectedDate, appointments, company.id, carriers, drivers, activeProfile, addAuditLog]
  );

  // UPDATE APPOINTMENT
  const updateAppointment = useCallback(
    (
      id: string,
      appData: Partial<Appointment>,
      isOverride = false,
      overrideReason = ''
    ): { success: boolean; message: string } => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO'])) {
        return { success: false, message: 'Perfil não possui permissão para editar agendamentos.' };
      }

      const existing = appointments.find((a) => a.id === id);
      if (!existing) return { success: false, message: 'Agendamento não encontrado.' };

      if (appData.windowStart && appData.windowStart !== existing.windowStart) {
        const duration = appData.estimatedDurationMinutes || existing.estimatedDurationMinutes;
        const validation = validateAppointmentCapacity(
          selectedDate,
          appData.windowStart,
          duration + 15,
          appointments,
          id
        );
        if (!validation.isValid && !isOverride) {
          return { success: false, message: validation.message };
        }
      }

      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...appData, updatedAt: new Date().toISOString() } : app))
      );

      addAuditLog({
        action: isOverride ? 'ALTERACAO_COM_SOBRECARGA' : 'AGENDAMENTO_ATUALIZADO',
        entityType: 'AGENDAMENTO',
        entityId: id,
        details: `Agendamento ${existing.code} atualizado. ${
          isOverride ? `SOBRECARGA CONFIRMADA: "${overrideReason}"` : ''
        }`,
        isOverrideAlert: isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
        previousValue: existing.windowStart,
        newValue: appData.windowStart,
      });

      return { success: true, message: 'Agendamento atualizado com sucesso.' };
    },
    [hasPermission, appointments, selectedDate, addAuditLog]
  );

  // CANCEL APPOINTMENT
  const cancelAppointment = useCallback(
    (id: string, reason: string) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO'])) return;
      const existing = appointments.find((a) => a.id === id);
      if (!existing) return;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'CANCELADO', notes: reason, updatedAt: new Date().toISOString() } : a))
      );

      // Release yard slot if held
      setYardSlots((prev) =>
        prev.map((s) => (s.currentAppointmentId === id ? { ...s, isOccupied: false, currentAppointmentId: undefined } : s))
      );

      // Release dock if held
      setDocks((prev) =>
        prev.map((d) => (d.currentAppointmentId === id ? { ...d, status: 'LIVRE', currentAppointmentId: undefined, progressPercentage: 0 } : d))
      );

      // Remove from queue
      setQueue((prev) => prev.filter((q) => q.appointmentId !== id));

      addAuditLog({
        action: 'AGENDAMENTO_CANCELADO',
        entityType: 'AGENDAMENTO',
        entityId: id,
        details: `Agendamento ${existing.code} (${existing.vehiclePlate}) cancelado. Motivo: ${reason}`,
      });
    },
    [hasPermission, appointments, addAuditLog]
  );

  // CHECK-IN (PORTARIA)
  const performCheckIn = useCallback(
    (
      appointmentId: string,
      notes?: string
    ): { success: boolean; message: string; delayCategory: string; delayMinutes: number } => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_PATIO'])) {
        return { success: false, message: 'Sem permissão para realizar check-in.', delayCategory: 'PONTUAL', delayMinutes: 0 };
      }

      const app = appointments.find((a) => a.id === appointmentId);
      if (!app) {
        return { success: false, message: 'Agendamento não encontrado.', delayCategory: 'PONTUAL', delayMinutes: 0 };
      }

      // Calculate deviation between current time and scheduled time
      const scheduledM = timeToMinutes(app.windowStart);
      const currentM = timeToMinutes(currentTimeStr);
      const diffMinutes = currentM - scheduledM;

      let delayCat: 'PONTUAL' | 'ATRASADO' | 'ANTECIPADO' = 'PONTUAL';
      if (diffMinutes > 10) {
        delayCat = 'ATRASADO';
      } else if (diffMinutes < -10) {
        delayCat = 'ANTECIPADO';
      }

      // Check available yard bay
      const freeSlot = yardSlots.find((s) => !s.isOccupied);
      let targetStatus: Appointment['status'] = 'NO_PATIO';
      let allocatedSlotId: number | undefined = undefined;

      if (freeSlot) {
        allocatedSlotId = freeSlot.id;
        setYardSlots((prev) =>
          prev.map((s) =>
            s.id === freeSlot.id
              ? { ...s, isOccupied: true, currentAppointmentId: app.id, parkedSince: currentTimeStr }
              : s
          )
        );
      } else {
        // Yard is at maximum (8 vehicles) -> put in queue
        targetStatus = 'NA_FILA';
        const newQueueItem: WaitingQueueItem = {
          id: `q-${Date.now()}`,
          appointmentId: app.id,
          enteredAt: currentTimeStr,
          priority: app.priority,
          queuePosition: queue.length + 1,
          reason: 'Pátio cheio (8/8) ou aguardando liberação de doca',
        };
        setQueue((prev) => [...prev, newQueueItem]);
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: targetStatus,
                actualCheckInTime: currentTimeStr,
                actualYardEntryTime: currentTimeStr,
                delayMinutes: diffMinutes,
                delayCategory: delayCat,
                assignedYardSlotId: allocatedSlotId,
                notes: notes ? `${a.notes || ''} [Portaria: ${notes}]` : a.notes,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );

      const delayMessage =
        delayCat === 'ATRASADO'
          ? `Atraso detectado: +${diffMinutes} min.`
          : delayCat === 'ANTECIPADO'
          ? `Chegada antecipada: ${Math.abs(diffMinutes)} min antes do previsto.`
          : 'Chegada pontual.';

      addAuditLog({
        action: 'CHECKIN_REALIZADO',
        entityType: 'CHECKIN',
        entityId: app.id,
        details: `Check-in de ${app.code} (${app.vehiclePlate}). ${delayMessage} Entrada alocada: ${
          allocatedSlotId ? `Vaga P-0${allocatedSlotId}` : 'Fila de espera (Pátio cheio)'
        }`,
      });

      return {
        success: true,
        message: `Check-in confirmado com sucesso! ${delayMessage}`,
        delayCategory: delayCat,
        delayMinutes: diffMinutes,
      };
    },
    [hasPermission, appointments, currentTimeStr, yardSlots, queue.length, addAuditLog]
  );

  // YARD SLOT ALLOCATION
  const assignToYardSlot = useCallback(
    (appointmentId: string, slotId: number) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_PATIO'])) {
        return { success: false, message: 'Sem permissão para movimentação de pátio.' };
      }

      const targetSlot = yardSlots.find((s) => s.id === slotId);
      if (targetSlot && targetSlot.isOccupied && targetSlot.currentAppointmentId !== appointmentId) {
        return { success: false, message: `Vaga P-0${slotId} já está ocupada!` };
      }

      // Free previous slot if any
      setYardSlots((prev) =>
        prev.map((s) => {
          if (s.currentAppointmentId === appointmentId && s.id !== slotId) {
            return { ...s, isOccupied: false, currentAppointmentId: undefined, parkedSince: undefined };
          }
          if (s.id === slotId) {
            return { ...s, isOccupied: true, currentAppointmentId: appointmentId, parkedSince: currentTimeStr };
          }
          return s;
        })
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, assignedYardSlotId: slotId, status: 'NO_PATIO', updatedAt: new Date().toISOString() } : a
        )
      );

      // Remove from queue if was in queue
      setQueue((prev) => prev.filter((q) => q.appointmentId !== appointmentId));

      addAuditLog({
        action: 'PATIO_ALOCADO',
        entityType: 'PATIO',
        entityId: appointmentId,
        details: `Veículo alocado na Vaga P-0${slotId}.`,
      });

      return { success: true, message: `Veículo posicionado na Vaga P-0${slotId}.` };
    },
    [hasPermission, yardSlots, currentTimeStr, addAuditLog]
  );

  // DOCK ALLOCATION
  const assignToDock = useCallback(
    (appointmentId: string, dockId: number) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_PATIO', 'OPERADOR_DOCA'])) {
        return { success: false, message: 'Sem permissão para alocar doca.' };
      }

      const targetDock = docks.find((d) => d.id === dockId);
      if (!targetDock) return { success: false, message: 'Doca inválida.' };

      if (targetDock.isMaintenance) {
        return { success: false, message: `Doca ${dockId} está em manutenção: ${targetDock.maintenanceReason || ''}` };
      }

      if (targetDock.status === 'EM_OPERACAO' && targetDock.currentAppointmentId !== appointmentId) {
        return { success: false, message: `Conflito de doca: Doca ${dockId} já está ocupada e em operação!` };
      }

      // Check lunch block
      if (currentTimeStr >= '11:00' && currentTimeStr < '12:00') {
        return { success: false, message: 'Operações em doca estão bloqueadas durante o intervalo de almoço (11:00 às 12:00).' };
      }

      // Free previous dock if any
      setDocks((prev) =>
        prev.map((d) => {
          if (d.currentAppointmentId === appointmentId && d.id !== dockId) {
            return { ...d, status: 'LIVRE', currentAppointmentId: undefined, progressPercentage: 0 };
          }
          if (d.id === dockId) {
            return {
              ...d,
              status: 'EM_OPERACAO',
              currentAppointmentId: appointmentId,
              startedOperationAt: currentTimeStr,
              progressPercentage: 10,
            };
          }
          return d;
        })
      );

      // Update appointment
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'EM_DOCA',
                assignedDockId: dockId,
                actualDockEntryTime: currentTimeStr,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );

      // Remove from queue if present
      setQueue((prev) => prev.filter((q) => q.appointmentId !== appointmentId));

      addAuditLog({
        action: 'DOCA_ALOCADA',
        entityType: 'DOCA',
        entityId: `doca-${dockId}`,
        details: `Caminhão alocado na Doca ${dockId.toString().padStart(2, '0')}.`,
      });

      return { success: true, message: `Caminhão direcionado com sucesso para a Doca ${dockId}!` };
    },
    [hasPermission, docks, currentTimeStr, addAuditLog]
  );

  // MOVE TO QUEUE
  const moveToQueue = useCallback(
    (appointmentId: string, reason = 'Aguardando doca compatível') => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_PATIO'])) return;
      const app = appointments.find((a) => a.id === appointmentId);
      if (!app) return;

      const exists = queue.some((q) => q.appointmentId === appointmentId);
      if (!exists) {
        const newItem: WaitingQueueItem = {
          id: `q-${Date.now()}`,
          appointmentId,
          enteredAt: currentTimeStr,
          priority: app.priority,
          queuePosition: queue.length + 1,
          reason,
        };
        setQueue((prev) => [...prev, newItem]);
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: 'NA_FILA', updatedAt: new Date().toISOString() } : a))
      );

      addAuditLog({
        action: 'FILA_MOVIMENTADA',
        entityType: 'PATIO',
        entityId: appointmentId,
        details: `Veículo ${app.vehiclePlate} movido para a fila de espera. Motivo: ${reason}`,
      });
    },
    [hasPermission, appointments, queue, currentTimeStr, addAuditLog]
  );

  // DOCK ACTIONS
  const startUnloading = useCallback(
    (dockId: number) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_DOCA'])) return;
      const dock = docks.find((d) => d.id === dockId);
      if (!dock || !dock.currentAppointmentId) return;

      setDocks((prev) =>
        prev.map((d) =>
          d.id === dockId
            ? { ...d, status: 'EM_OPERACAO', startedOperationAt: currentTimeStr, progressPercentage: 20 }
            : d
        )
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === dock.currentAppointmentId
            ? { ...a, status: 'DESCARREGANDO', unloadingStartTime: currentTimeStr, updatedAt: new Date().toISOString() }
            : a
        )
      );

      addAuditLog({
        action: 'DESCARGA_INICIADA',
        entityType: 'DOCA',
        entityId: `doca-${dockId}`,
        details: `Descarregamento iniciado na Doca ${dockId}.`,
      });
    },
    [hasPermission, docks, currentTimeStr, addAuditLog]
  );

  const pauseUnloading = useCallback(
    (dockId: number, reason: string) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_DOCA'])) return;
      setDocks((prev) =>
        prev.map((d) => (d.id === dockId ? { ...d, status: 'AGUARDANDO_VEICULO' } : d))
      );

      addAuditLog({
        action: 'DESCARGA_PAUSADA',
        entityType: 'DOCA',
        entityId: `doca-${dockId}`,
        details: `Operação pausada na Doca ${dockId}. Motivo: ${reason}`,
      });
    },
    [hasPermission, addAuditLog]
  );

  const finishUnloading = useCallback(
    (dockId: number) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_DOCA'])) return;
      const dock = docks.find((d) => d.id === dockId);
      if (!dock || !dock.currentAppointmentId) return;

      const appId = dock.currentAppointmentId;

      setDocks((prev) =>
        prev.map((d) =>
          d.id === dockId
            ? {
                ...d,
                status: 'LIVRE',
                currentAppointmentId: undefined,
                startedOperationAt: undefined,
                progressPercentage: 100,
              }
            : d
        )
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: 'NO_PATIO',
                unloadingEndTime: currentTimeStr,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );

      addAuditLog({
        action: 'DESCARGA_CONCLUIDA',
        entityType: 'DOCA',
        entityId: `doca-${dockId}`,
        details: `Descarregamento finalizado com sucesso na Doca ${dockId}. Veículo liberado para portaria de saída.`,
      });

      // Auto summon next truck in queue for this dock if eligible
      const nextInQueue = queue[0];
      if (nextInQueue) {
        // Will be summoned or operator can click to call
      }
    },
    [hasPermission, docks, currentTimeStr, queue, addAuditLog]
  );

  // REGISTER DEPARTURE (SAÍDA DO CD)
  const registerDeparture = useCallback(
    (appointmentId: string) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO', 'OPERADOR_PATIO'])) return;
      const app = appointments.find((a) => a.id === appointmentId);
      if (!app) return;

      // Free yard slot
      setYardSlots((prev) =>
        prev.map((s) =>
          s.currentAppointmentId === appointmentId
            ? { ...s, isOccupied: false, currentAppointmentId: undefined, parkedSince: undefined }
            : s
        )
      );

      // Free dock if still attached
      setDocks((prev) =>
        prev.map((d) =>
          d.currentAppointmentId === appointmentId
            ? { ...d, status: 'LIVRE', currentAppointmentId: undefined, progressPercentage: 0 }
            : d
        )
      );

      // Remove from queue
      setQueue((prev) => prev.filter((q) => q.appointmentId !== appointmentId));

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status: 'FINALIZADO',
                actualDepartureTime: currentTimeStr,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );

      addAuditLog({
        action: 'SAIDA_REGISTRADA',
        entityType: 'PATIO',
        entityId: appointmentId,
        details: `Saída do CD registrada para ${app.code} (${app.vehiclePlate}). Ciclo operacional concluído.`,
      });
    },
    [hasPermission, appointments, currentTimeStr, addAuditLog]
  );

  // APPLY OPTIMIZATION
  const applyOptimization = useCallback(
    (optimizedList: Appointment[]) => {
      if (!hasPermission(['ADMIN', 'GESTOR_LOGISTICO'])) return;
      setAppointments(optimizedList);

      addAuditLog({
        action: 'OTIMIZACAO_APLICADA',
        entityType: 'OTIMIZACAO',
        entityId: `opt-${Date.now()}`,
        details: `Otimização inteligente da agenda diária aplicada para os ${OPERATIONAL_LIMITS.DAILY_TRUCK_TARGET} caminhões. Picos de pátio balanceados e bloqueio de almoço respeitado.`,
      });
    },
    [hasPermission, addAuditLog]
  );

  // RESET DEMO
  const resetToInitialDemo = useCallback(() => {
    clearTMSStorage();
    setAppointments(INITIAL_APPOINTMENTS);
    setYardSlots(INITIAL_YARD_SLOTS);
    setDocks(INITIAL_DOCKS);
    setQueue(INITIAL_QUEUE);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setConfig(INITIAL_CONFIG);
    setCurrentTimeStr('09:40');
  }, []);

  const updateConfig = useCallback(
    (newConfig: Partial<SystemConfig>) => {
      if (!hasPermission(['ADMIN'])) return;
      setConfig((prev) => ({ ...prev, ...newConfig }));
      addAuditLog({
        action: 'CONFIG_ATUALIZADA',
        entityType: 'CONFIG',
        entityId: 'system_settings',
        details: 'Parâmetros operacionais do CD Move Log atualizados.',
      });
    },
    [hasPermission, addAuditLog]
  );

  const value = useMemo(
    () => ({
      appointments,
      yardSlots,
      docks,
      queue,
      carriers,
      drivers,
      auditLogs,
      config,
      company,
      activeProfile,
      availableProfiles: INITIAL_PROFILES,
      currentTimeStr,
      isClockRunning,
      selectedDate,
      setSelectedDate,
      setCurrentTimeStr,
      toggleClockRunning,
      switchProfile,
      hasPermission,
      checkCapacity,
      createAppointment,
      updateAppointment,
      cancelAppointment,
      performCheckIn,
      assignToYardSlot,
      assignToDock,
      moveToQueue,
      startUnloading,
      pauseUnloading,
      finishUnloading,
      registerDeparture,
      applyOptimization,
      resetToInitialDemo,
      updateConfig,
    }),
    [
      appointments,
      yardSlots,
      docks,
      queue,
      carriers,
      drivers,
      auditLogs,
      config,
      company,
      activeProfile,
      currentTimeStr,
      isClockRunning,
      selectedDate,
      toggleClockRunning,
      switchProfile,
      hasPermission,
      checkCapacity,
      createAppointment,
      updateAppointment,
      cancelAppointment,
      performCheckIn,
      assignToYardSlot,
      assignToDock,
      moveToQueue,
      startUnloading,
      pauseUnloading,
      finishUnloading,
      registerDeparture,
      applyOptimization,
      resetToInitialDemo,
      updateConfig,
    ]
  );

  return <TMSContext.Provider value={value}>{children}</TMSContext.Provider>;
};

export const useTMS = (): TMSContextType => {
  const context = useContext(TMSContext);
  if (!context) {
    throw new Error('useTMS must be used within a TMSProvider');
  }
  return context;
};
