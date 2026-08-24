import { dbStore } from './store';
import { notificationService } from './notification-service';
import { Appointment, DoctorLeave } from '../types';

export interface LeaveApplicationResult {
  success: boolean;
  leave?: DoctorLeave;
  affectedAppointments: Appointment[];
  notifiedPatientsCount: number;
  error?: string;
}

export const leaveManager = {
  async applyDoctorLeave(params: {
    doctorId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveApplicationResult> {
    const { doctorId, startDate, endDate, reason } = params;

    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) {
      return {
        success: false,
        affectedAppointments: [],
        notifiedPatientsCount: 0,
        error: 'Doctor not found',
      };
    }

    if (startDate > endDate) {
      return {
        success: false,
        affectedAppointments: [],
        notifiedPatientsCount: 0,
        error: 'Start date cannot be after end date',
      };
    }

    const allAppointments = dbStore.getAppointments();
    const affectedAppointments = allAppointments.filter((apt) => {
      if (apt.doctorId !== doctorId) return false;
      if (apt.status !== 'CONFIRMED' && apt.status !== 'HELD') return false;
      return apt.appointmentDate >= startDate && apt.appointmentDate <= endDate;
    });

    const leave = dbStore.addDoctorLeave(doctorId, {
      startDate,
      endDate,
      reason,
      affectedAppointmentsCount: affectedAppointments.length,
    });

    if (!leave) {
      return {
        success: false,
        affectedAppointments: [],
        notifiedPatientsCount: 0,
        error: 'Failed to record doctor leave schedule',
      };
    }

    const activeHolds = dbStore.getSlotHolds();
    for (const hold of activeHolds) {
      if (
        hold.doctorId === doctorId &&
        hold.appointmentDate >= startDate &&
        hold.appointmentDate <= endDate
      ) {
        dbStore.releaseSlotHold(hold.id);
      }
    }

    let notifiedPatientsCount = 0;

    for (const apt of affectedAppointments) {
      dbStore.updateAppointment(apt.id, {
        status: 'RESCHEDULE_NEEDED',
        cancellationReason: `Doctor leave: ${reason}`,
        rescheduleNoticeSent: true,
      });

      await notificationService.sendDoctorLeaveAlert({
        patientEmail: apt.patientEmail,
        patientName: apt.patientName,
        doctorName: doctor.name,
        doctorSpecialisation: doctor.specialisation,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        reason,
        appointmentId: apt.id,
      });

      notifiedPatientsCount++;
    }

    return {
      success: true,
      leave,
      affectedAppointments,
      notifiedPatientsCount,
    };
  },

  previewLeaveConflicts(doctorId: string, startDate: string, endDate: string): Appointment[] {
    const allAppointments = dbStore.getAppointments();
    return allAppointments.filter((apt) => {
      if (apt.doctorId !== doctorId) return false;
      if (apt.status !== 'CONFIRMED' && apt.status !== 'HELD') return false;
      return apt.appointmentDate >= startDate && apt.appointmentDate <= endDate;
    });
  },
};
