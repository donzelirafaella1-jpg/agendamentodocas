/**
 * Move Log TMS - Yard Capacity & Overlap Validation Service
 * Computes minute-by-minute vehicle overlap to strictly enforce
 * the 8-truck yard limit and 11:00-12:00 lunch block rules.
 */

import { Appointment, CapacityCheckResult } from '../types';

export const OPERATIONAL_LIMITS = {
  SHIFT_1_START: '07:00',
  SHIFT_1_END: '11:00',
  LUNCH_START: '11:00',
  LUNCH_END: '12:00',
  SHIFT_2_START: '12:00',
  SHIFT_2_END: '16:00',
  MAX_YARD_CAPACITY: 8,
  TOTAL_DOCKS: 14,
  DAILY_TRUCK_TARGET: 32,
};

/**
 * Converts "HH:MM" to minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from 00:00 to "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Determines whether a time interval intersects with the lunch break (11:00 - 12:00)
 */
export function intersectsLunchBlock(startMinutes: number, endMinutes: number): boolean {
  const lunchStart = timeToMinutes(OPERATIONAL_LIMITS.LUNCH_START); // 660 (11:00)
  const lunchEnd = timeToMinutes(OPERATIONAL_LIMITS.LUNCH_END);     // 720 (12:00)

  // Intersection exists if max(start1, start2) < min(end1, end2)
  return Math.max(startMinutes, lunchStart) < Math.min(endMinutes, lunchEnd);
}

/**
 * Checks if interval is within valid operational shifts:
 * [07:00 - 11:00] OR [12:00 - 16:00]
 */
export function isWithinOperationalHours(startMinutes: number, endMinutes: number): boolean {
  const shift1Start = timeToMinutes(OPERATIONAL_LIMITS.SHIFT_1_START); // 420
  const shift1End = timeToMinutes(OPERATIONAL_LIMITS.SHIFT_1_END);     // 660
  const shift2Start = timeToMinutes(OPERATIONAL_LIMITS.SHIFT_2_START); // 720
  const shift2End = timeToMinutes(OPERATIONAL_LIMITS.SHIFT_2_END);     // 960

  // Must start at or after 07:00 and end before or at 16:00
  if (startMinutes < shift1Start || endMinutes > shift2End) {
    return false;
  }

  // Must not cross into or encompass lunch block
  if (intersectsLunchBlock(startMinutes, endMinutes)) {
    return false;
  }

  return true;
}

/**
 * Returns the effective yard stay interval for an appointment [startMinutes, endMinutes]
 */
export function getAppointmentYardWindow(app: Appointment): { start: number; end: number } {
  // If actual times are recorded, use them; otherwise use scheduled window + estimated stay
  let startStr = app.windowStart;
  if (app.actualCheckInTime) {
    startStr = app.actualCheckInTime;
  }

  const start = timeToMinutes(startStr);
  const stayDuration = app.estimatedStayMinutes || (app.estimatedDurationMinutes + 15);
  const end = start + stayDuration;

  return { start, end };
}

/**
 * Computes the number of vehicles simultaneously present in the yard at a given minute
 */
export function getSimultaneousYardCountAtMinute(
  minute: number,
  appointments: Appointment[],
  date: string,
  excludeAppointmentId?: string
): number {
  let count = 0;

  for (const app of appointments) {
    if (app.date !== date) continue;
    if (excludeAppointmentId && app.id === excludeAppointmentId) continue;
    if (app.status === 'FINALIZADO' || app.status === 'CANCELADO') continue;

    const { start, end } = getAppointmentYardWindow(app);
    if (minute >= start && minute < end) {
      count++;
    }
  }

  return count;
}

/**
 * Evaluates yard capacity for a candidate appointment slot.
 * Enforces:
 * 1. Strict operational shifts (07:00-11:00 and 12:00-16:00).
 * 2. Mandatory lunch block (11:00-12:00).
 * 3. Max 8 vehicles simultaneously in the yard across the entire stay window.
 *
 * If capacity exceeded, yields exact required message:
 * “Horário indisponível. A capacidade máxima do pátio será atingida neste período.”
 * and suggests alternative slots.
 */
export function validateAppointmentCapacity(
  date: string,
  startTimeStr: string,
  stayMinutes: number,
  appointments: Appointment[],
  excludeAppointmentId?: string
): CapacityCheckResult {
  const candidateStart = timeToMinutes(startTimeStr);
  const candidateEnd = candidateStart + stayMinutes;

  // 1. Check Lunch block
  if (intersectsLunchBlock(candidateStart, candidateEnd)) {
    const alternativeSlots = findAvailableAlternativeSlots(date, stayMinutes, appointments, excludeAppointmentId);
    return {
      isValid: false,
      isBlockedLunchTime: true,
      isYardFull: false,
      peakOccupancy: 0,
      maxAllowed: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
      message: 'Horário bloqueado para almoço operacional (11:00 às 12:00). Nenhum veículo pode permanecer no pátio ou docas durante este intervalo.',
      suggestedAlternativeSlots: alternativeSlots.slice(0, 4),
    };
  }

  // 2. Check Operational Shift hours
  if (!isWithinOperationalHours(candidateStart, candidateEnd)) {
    const alternativeSlots = findAvailableAlternativeSlots(date, stayMinutes, appointments, excludeAppointmentId);
    return {
      isValid: false,
      isBlockedLunchTime: false,
      isYardFull: false,
      peakOccupancy: 0,
      maxAllowed: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
      message: 'Horário fora do turno operacional do CD Move Log (Turno 1: 07:00–11:00 | Turno 2: 12:00–16:00).',
      suggestedAlternativeSlots: alternativeSlots.slice(0, 4),
    };
  }

  // 3. Test simultaneous overlap minute by minute (in 5-min intervals)
  let maxOccupancyFound = 0;
  for (let m = candidateStart; m < candidateEnd; m += 5) {
    const currentCount = getSimultaneousYardCountAtMinute(m, appointments, date, excludeAppointmentId);
    if (currentCount > maxOccupancyFound) {
      maxOccupancyFound = currentCount;
    }
  }

  // If candidate appointment is added, peak will be maxOccupancyFound + 1
  const peakWithCandidate = maxOccupancyFound + 1;

  if (peakWithCandidate > OPERATIONAL_LIMITS.MAX_YARD_CAPACITY) {
    const alternativeSlots = findAvailableAlternativeSlots(date, stayMinutes, appointments, excludeAppointmentId);
    return {
      isValid: false,
      isBlockedLunchTime: false,
      isYardFull: true,
      peakOccupancy: peakWithCandidate,
      maxAllowed: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
      // EXACT REQUIRED STRING IN USER SPECIFICATION:
      message: 'Horário indisponível. A capacidade máxima do pátio será atingida neste período.',
      suggestedAlternativeSlots: alternativeSlots.slice(0, 4),
    };
  }

  return {
    isValid: true,
    isBlockedLunchTime: false,
    isYardFull: false,
    peakOccupancy: peakWithCandidate,
    maxAllowed: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
    message: `Horário disponível. Ocupação máxima estimada no pátio: ${peakWithCandidate}/${OPERATIONAL_LIMITS.MAX_YARD_CAPACITY} veículos.`,
    suggestedAlternativeSlots: [],
  };
}

/**
 * Finds alternative available operational slots during the day
 * where peak yard capacity does not exceed 8.
 */
export function findAvailableAlternativeSlots(
  date: string,
  stayMinutes: number,
  appointments: Appointment[],
  excludeAppointmentId?: string
): string[] {
  const suggestions: string[] = [];
  const candidateTimes = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'
  ];

  for (const timeStr of candidateTimes) {
    const startM = timeToMinutes(timeStr);
    const endM = startM + stayMinutes;

    if (intersectsLunchBlock(startM, endM) || !isWithinOperationalHours(startM, endM)) {
      continue;
    }

    let peak = 0;
    for (let m = startM; m < endM; m += 5) {
      const count = getSimultaneousYardCountAtMinute(m, appointments, date, excludeAppointmentId);
      if (count > peak) peak = count;
    }

    if (peak + 1 <= OPERATIONAL_LIMITS.MAX_YARD_CAPACITY) {
      suggestions.push(timeStr);
    }
  }

  return suggestions;
}

/**
 * Returns hourly yard load data throughout the operational day for charts and gauges
 */
export function getHourlyYardLoad(date: string, appointments: Appointment[]) {
  const hours = [
    '07:00', '08:00', '09:00', '10:00',
    '11:00', // Lunch block
    '12:00', '13:00', '14:00', '15:00', '16:00'
  ];

  return hours.map((hourStr) => {
    const isLunch = hourStr === '11:00';
    if (isLunch) {
      return {
        hour: hourStr,
        count: 0,
        capacity: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
        percentage: 0,
        isBlocked: true,
        label: 'Bloqueado (Almoço)',
      };
    }

    const min = timeToMinutes(hourStr) + 15; // sample mid-hour
    const count = getSimultaneousYardCountAtMinute(min, appointments, date);
    const percentage = Math.round((count / OPERATIONAL_LIMITS.MAX_YARD_CAPACITY) * 100);

    return {
      hour: hourStr,
      count,
      capacity: OPERATIONAL_LIMITS.MAX_YARD_CAPACITY,
      percentage,
      isBlocked: false,
      label: `${count}/${OPERATIONAL_LIMITS.MAX_YARD_CAPACITY}`,
    };
  });
}
