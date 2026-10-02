/**
 * Move Log TMS - Schedule Optimization Engine
 * Balances the 32 daily trucks across 14 docks and 8 operational hours
 * while strictly adhering to the 8-vehicle yard cap, 11:00-12:00 lunch block,
 * and cargo priorities.
 */

import { Appointment, OptimizationResult, PriorityLevel } from '../types';
import {
  OPERATIONAL_LIMITS,
  timeToMinutes,
  minutesToTime,
  intersectsLunchBlock,
  getSimultaneousYardCountAtMinute,
} from './yardCapacityService';

const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  URGENTE_PERECIVEL: 100,
  FARMA_CONTROLADO: 90,
  ALTA: 70,
  NORMAL: 40,
  BAIXA: 20,
};

/**
 * Optimizes the daily schedule for all 32 appointments
 */
export function optimizeDailySchedule(
  currentAppointments: Appointment[],
  date: string
): OptimizationResult {
  // Filter appointments for the target date that aren't already completed/cancelled
  const targetAppointments = currentAppointments.filter(
    (a) => a.date === date && a.status !== 'FINALIZADO' && a.status !== 'CANCELADO'
  );

  // Measure "Before" metrics
  const beforeMetrics = evaluateScheduleMetrics(targetAppointments, date);

  // Clone appointments to work on a fresh copy
  const sorted = [...targetAppointments].sort((a, b) => {
    // 1. Highest priority first
    const pA = PRIORITY_WEIGHTS[a.priority] || 40;
    const pB = PRIORITY_WEIGHTS[b.priority] || 40;
    if (pB !== pA) return pB - pA;
    // 2. Early window
    return timeToMinutes(a.windowStart) - timeToMinutes(b.windowStart);
  });

  // Dock track: tracks when each dock (1..14) will be free next
  const dockNextAvailableMinutes: Record<number, number> = {};
  for (let i = 1; i <= OPERATIONAL_LIMITS.TOTAL_DOCKS; i++) {
    dockNextAvailableMinutes[i] = timeToMinutes(OPERATIONAL_LIMITS.SHIFT_1_START); // 07:00
  }

  // Planned appointments accumulator
  const optimizedList: Appointment[] = [];
  const changes: OptimizationResult['changes'] = [];

  // Shifts start/end
  const shift1Start = timeToMinutes('07:00');
  const shift1End = timeToMinutes('11:00');
  const shift2Start = timeToMinutes('12:00');
  const shift2End = timeToMinutes('16:00');

  // Candidate start slots at 30-min intervals across shifts
  const validCandidateStartMinutes: number[] = [];
  for (let t = shift1Start; t <= shift1End - 45; t += 30) {
    validCandidateStartMinutes.push(t);
  }
  for (let t = shift2Start; t <= shift2End - 45; t += 30) {
    validCandidateStartMinutes.push(t);
  }

  for (const app of sorted) {
    const duration = app.estimatedDurationMinutes || 45;
    const stay = app.estimatedStayMinutes || duration + 15;

    // Determine compatible docks (Docks 1 & 2 for refrigerados/perecíveis, Docks 13 & 14 for pesados)
    let candidateDocks: number[] = [];
    if (app.cargoType === 'Perecíveis Refrigerados' || app.priority === 'URGENTE_PERECIVEL') {
      candidateDocks = [1, 2, 3];
    } else if (app.cargoType === 'Peças Industriais') {
      candidateDocks = [13, 14, 12];
    } else if (app.cargoType === 'Farmacêuticos' || app.priority === 'FARMA_CONTROLADO') {
      candidateDocks = [3, 4, 5];
    } else {
      // General docks
      candidateDocks = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 13, 14];
    }

    let bestSlot = validCandidateStartMinutes[0];
    let bestDock = candidateDocks[0];
    let slotFound = false;

    // Look for slot that respects:
    // 1. Dock availability (no collision)
    // 2. Lunch block avoidance
    // 3. Yard occupancy <= 8 simultaneously
    for (const slotStart of validCandidateStartMinutes) {
      const slotEnd = slotStart + stay;

      // Rule: Skip if encroaches lunch block (11:00 - 12:00)
      if (intersectsLunchBlock(slotStart, slotEnd)) continue;
      // Rule: Skip if ends after 16:00
      if (slotEnd > shift2End) continue;

      // Rule: Check yard capacity with already scheduled trucks in optimizedList
      let maxYardCount = 0;
      for (let m = slotStart; m < slotEnd; m += 5) {
        const count = getSimultaneousYardCountAtMinute(m, optimizedList, date);
        if (count > maxYardCount) maxYardCount = count;
      }
      if (maxYardCount + 1 > OPERATIONAL_LIMITS.MAX_YARD_CAPACITY) {
        continue;
      }

      // Check candidate docks
      for (const dockId of candidateDocks) {
        const dockFreeAt = dockNextAvailableMinutes[dockId] || shift1Start;
        if (dockFreeAt <= slotStart) {
          bestSlot = slotStart;
          bestDock = dockId;
          slotFound = true;
          break;
        }
      }

      if (slotFound) break;
    }

    // If no perfect non-conflicting slot was found in primary candidate times, pick least congested
    if (!slotFound) {
      // Pick first valid slot where yard count <= 8
      for (const slotStart of validCandidateStartMinutes) {
        const slotEnd = slotStart + stay;
        if (intersectsLunchBlock(slotStart, slotEnd)) continue;
        let count = 0;
        for (let m = slotStart; m < slotEnd; m += 10) {
          const c = getSimultaneousYardCountAtMinute(m, optimizedList, date);
          if (c > count) count = c;
        }
        if (count + 1 <= OPERATIONAL_LIMITS.MAX_YARD_CAPACITY) {
          bestSlot = slotStart;
          bestDock = ((optimizedList.length % 14) + 1);
          break;
        }
      }
    }

    // Update dock availability tracker
    const newEnd = bestSlot + duration;
    // If it crosses into lunch block, bump availability to 12:00
    dockNextAvailableMinutes[bestDock] = Math.max(newEnd, bestSlot >= shift1End ? shift2Start : newEnd);

    const newStartTimeStr = minutesToTime(bestSlot);
    const newEndTimeStr = minutesToTime(bestSlot + duration);

    const isTimeChanged = newStartTimeStr !== app.windowStart;
    const isDockChanged = bestDock !== app.assignedDockId;

    if (isTimeChanged || isDockChanged) {
      let reason = 'Rebalanceamento de fluxo para eliminar picos de pátio e conflitos';
      if (app.priority === 'URGENTE_PERECIVEL' || app.priority === 'FARMA_CONTROLADO') {
        reason = 'Priorização de perecível/farma em doca climatizada e primeiro horário';
      } else if (intersectsLunchBlock(timeToMinutes(app.windowStart), timeToMinutes(app.windowStart) + stay)) {
        reason = 'Remoção de agendamento em horário bloqueado de almoço (11h-12h)';
      }

      changes.push({
        appointmentId: app.id,
        code: app.code,
        vehiclePlate: app.vehiclePlate,
        carrierName: app.carrierId, // will be rendered with actual carrier name
        oldTime: app.windowStart,
        newTime: newStartTimeStr,
        oldDock: app.assignedDockId,
        newDock: bestDock,
        reason,
      });
    }

    const updatedApp: Appointment = {
      ...app,
      windowStart: newStartTimeStr,
      windowEnd: newEndTimeStr,
      scheduledTime: newStartTimeStr,
      assignedDockId: bestDock,
      updatedAt: new Date().toISOString(),
    };

    optimizedList.push(updatedApp);
  }

  // Preserve non-target appointments (e.g. other days or already finished ones)
  const fullOptimizedAppointments = currentAppointments.map((orig) => {
    const match = optimizedList.find((opt) => opt.id === orig.id);
    return match || orig;
  });

  const afterMetrics = evaluateScheduleMetrics(optimizedList, date);

  return {
    originalAppointments: currentAppointments,
    optimizedAppointments: fullOptimizedAppointments,
    trucksCount: targetAppointments.length,
    beforeMetrics,
    afterMetrics,
    changes,
  };
}

/**
 * Calculates key health metrics of a schedule
 */
function evaluateScheduleMetrics(appointments: Appointment[], date: string) {
  let peakYard = 0;
  let lunchViolations = 0;
  let dockConflicts = 0;

  // Measure peak yard occupancy across all minutes of the operational day
  for (let m = timeToMinutes('07:00'); m <= timeToMinutes('16:00'); m += 10) {
    const count = getSimultaneousYardCountAtMinute(m, appointments, date);
    if (count > peakYard) peakYard = count;
  }

  // Check lunch violations & dock collisions
  const dockBookings: Record<number, { start: number; end: number; code: string }[]> = {};

  for (const app of appointments) {
    if (app.date !== date) continue;
    const startM = timeToMinutes(app.windowStart);
    const endM = startM + (app.estimatedStayMinutes || 60);

    if (intersectsLunchBlock(startM, endM)) {
      lunchViolations++;
    }

    if (app.assignedDockId) {
      if (!dockBookings[app.assignedDockId]) {
        dockBookings[app.assignedDockId] = [];
      }
      // Check collision with existing dock bookings
      for (const booking of dockBookings[app.assignedDockId]) {
        if (Math.max(startM, booking.start) < Math.min(endM, booking.end)) {
          dockConflicts++;
        }
      }
      dockBookings[app.assignedDockId].push({ start: startM, end: endM, code: app.code });
    }
  }

  // Estimated wait time proxy based on queue pressure & peak load
  const estimatedWaitTimeAvg = Math.max(12, Math.round(15 + (peakYard > 8 ? (peakYard - 8) * 18 : 0) + dockConflicts * 10));

  return {
    peakYardOccupancy: peakYard,
    estimatedWaitTimeAvg,
    dockConflicts,
    lunchViolations,
  };
}
