import { dbStore } from './store';
import { SlotHold, TimeSlot } from '../types';

export const HOLD_DURATION_MS = 10 * 60 * 1000;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export const slotManager = {
  getDoctorSlotsForDate(doctorId: string, dateStr: string, currentPatientId?: string): {
    slots: TimeSlot[];
    doctorOnLeave: boolean;
    leaveReason?: string;
    workingHoursInfo?: string;
  } {
    dbStore.cleanupExpiredHolds();
    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) return { slots: [], doctorOnLeave: false };

    const leave = (doctor.leaveDays || []).find((l) => dateStr >= l.startDate && dateStr <= l.endDate);
    if (leave) {
      return { slots: [], doctorOnLeave: true, leaveReason: leave.reason || 'Doctor is on scheduled leave' };
    }

    const targetDate = new Date(`${dateStr}T12:00:00Z`);
    const dayOfWeek = targetDate.getUTCDay();
    const workingDay = doctor.workingHours.find((w) => w.dayOfWeek === dayOfWeek);
    if (!workingDay || !workingDay.isWorkingDay) {
      return {
        slots: [],
        doctorOnLeave: false,
        workingHoursInfo: `Doctor does not consult on ${
          ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][dayOfWeek]
        }`,
      };
    }

    const startMins = timeToMinutes(workingDay.startTime);
    const endMins = timeToMinutes(workingDay.endTime);
    const duration = doctor.slotDurationMinutes || 30;

    const existingAppointments = dbStore
      .getAppointments()
      .filter(
        (a) =>
          a.doctorId === doctorId &&
          a.appointmentDate === dateStr &&
          (a.status === 'CONFIRMED' || a.status === 'COMPLETED' || a.status === 'HELD')
      );

    const activeHolds = dbStore
      .getSlotHolds()
      .filter((h) => h.doctorId === doctorId && h.appointmentDate === dateStr);

    const now = Date.now();
    const slots: TimeSlot[] = [];

    for (let m = startMins; m + duration <= endMins; m += duration) {
      const slotStart = minutesToTime(m);
      const slotEnd = minutesToTime(m + duration);

      const isBooked = existingAppointments.some(
        (a) => a.startTime === slotStart && (a.status === 'CONFIRMED' || a.status === 'COMPLETED')
      );

      if (isBooked) {
        slots.push({ startTime: slotStart, endTime: slotEnd, status: 'BOOKED', isAvailable: false });
        continue;
      }

      const activeHold = activeHolds.find((h) => h.startTime === slotStart && h.expiresAt > now);
      if (activeHold) {
        const isMine = currentPatientId && activeHold.patientId === currentPatientId;
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: isMine ? 'HELD_BY_YOU' : 'HELD_BY_OTHER',
          holdExpiresAt: activeHold.expiresAt,
          holdId: activeHold.id,
          isAvailable: !!isMine,
        });
        continue;
      }

      slots.push({ startTime: slotStart, endTime: slotEnd, status: 'AVAILABLE', isAvailable: true });
    }

    return { slots, doctorOnLeave: false, workingHoursInfo: `${workingDay.startTime} - ${workingDay.endTime}` };
  },

  acquireSlotHold(params: {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
  }): { success: boolean; hold?: SlotHold; error?: string } {
    dbStore.cleanupExpiredHolds();
    const { doctorId, patientId, appointmentDate, startTime, endTime } = params;

    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) return { success: false, error: 'Doctor not found' };

    const isLeave = (doctor.leaveDays || []).some(
      (l) => appointmentDate >= l.startDate && appointmentDate <= l.endDate
    );
    if (isLeave) return { success: false, error: 'Doctor is on leave on this date' };

    const existing = dbStore
      .getAppointments()
      .find(
        (a) =>
          a.doctorId === doctorId &&
          a.appointmentDate === appointmentDate &&
          a.startTime === startTime &&
          (a.status === 'CONFIRMED' || a.status === 'COMPLETED')
      );

    if (existing) return { success: false, error: 'This time slot was just booked by another patient' };

    const now = Date.now();
    const existingHold = dbStore
      .getSlotHolds()
      .find(
        (h) =>
          h.doctorId === doctorId &&
          h.appointmentDate === appointmentDate &&
          h.startTime === startTime &&
          h.expiresAt > now
      );

    if (existingHold) {
      if (existingHold.patientId === patientId) {
        existingHold.expiresAt = now + HOLD_DURATION_MS;
        return { success: true, hold: existingHold };
      }
      return {
        success: false,
        error: 'Slot is temporarily reserved by another patient. Please select another slot.',
      };
    }

    dbStore.releasePatientHolds(patientId);

    const hold = dbStore.createSlotHold({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
      expiresAt: now + HOLD_DURATION_MS,
    });

    return { success: true, hold };
  },

  validateAndClaimSlot(params: {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    startTime: string;
  }): { valid: boolean; error?: string } {
    dbStore.cleanupExpiredHolds();
    const { doctorId, patientId, appointmentDate, startTime } = params;

    const existing = dbStore
      .getAppointments()
      .find(
        (a) =>
          a.doctorId === doctorId &&
          a.appointmentDate === appointmentDate &&
          a.startTime === startTime &&
          (a.status === 'CONFIRMED' || a.status === 'COMPLETED')
      );

    if (existing) return { valid: false, error: 'Double-booking conflict: This slot was already confirmed.' };

    const now = Date.now();
    const activeHold = dbStore
      .getSlotHolds()
      .find(
        (h) =>
          h.doctorId === doctorId &&
          h.appointmentDate === appointmentDate &&
          h.startTime === startTime &&
          h.expiresAt > now
      );

    if (activeHold && activeHold.patientId !== patientId) {
      return { valid: false, error: 'Slot is currently reserved by another patient.' };
    }

    return { valid: true };
  },
};
