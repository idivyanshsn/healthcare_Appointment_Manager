import { dbStore } from './store';
import { NotificationLog, UserRole, MedicationReminder } from '../types';

export const notificationService = {
  async sendEmail(params: {
    to: string;
    recipientName: string;
    recipientRole: UserRole;
    type: NotificationLog['type'];
    subject: string;
    htmlContent: string;
    textContent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<NotificationLog> {
    const { to, recipientName, recipientRole, type, subject, htmlContent, textContent, metadata } = params;

    let status: 'SENT' | 'FAILED' = 'SENT';
    let errorMessage: string | undefined;

    const resendKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || 'Healthcare Clinic <notifications@healthmanager.clinic>';

    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to,
            subject,
            html: htmlContent,
            text: textContent || subject,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          status = 'FAILED';
          errorMessage = `Resend API Error: ${JSON.stringify(errData)}`;
        }
      } catch (err: any) {
        status = 'FAILED';
        errorMessage = err?.message || 'Network transport failure';
      }
    }

    const log = dbStore.createNotificationLog({
      recipientEmail: to,
      recipientName,
      recipientRole,
      type,
      subject,
      content: textContent || subject,
      status,
      retryCount: 0,
      errorMessage,
      metadata,
    });

    return log;
  },

  async sendBookingConfirmation(params: {
    patientEmail: string;
    patientName: string;
    doctorEmail: string;
    doctorName: string;
    doctorSpecialisation: string;
    appointmentDate: string;
    startTime: string;
    roomNumber?: string;
    urgencyLevel?: string;
    appointmentId: string;
  }) {
    const {
      patientEmail,
      patientName,
      doctorEmail,
      doctorName,
      doctorSpecialisation,
      appointmentDate,
      startTime,
      roomNumber,
      urgencyLevel,
      appointmentId,
    } = params;

    await this.sendEmail({
      to: patientEmail,
      recipientName: patientName,
      recipientRole: 'patient',
      type: 'BOOKING_CONFIRMATION',
      subject: `Appointment Confirmed: ${doctorName} (${doctorSpecialisation}) on ${appointmentDate}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f766e;">Appointment Confirmation</h2>
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>Your appointment has been successfully booked and confirmed.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> ${doctorName} (${doctorSpecialisation})</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${startTime}</p>
            ${roomNumber ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${roomNumber}</p>` : ''}
            <p style="margin: 4px 0;"><strong>Appointment ID:</strong> ${appointmentId}</p>
          </div>
          <p>Please arrive 10 minutes early. You can manage or reschedule your appointment at any time from your patient portal.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
        </div>
      `,
      textContent: `Appointment confirmed with ${doctorName} (${doctorSpecialisation}) on ${appointmentDate} at ${startTime}. Location: ${roomNumber || 'Clinic'}.`,
      metadata: { appointmentId, appointmentDate, startTime },
    });

    await this.sendEmail({
      to: doctorEmail,
      recipientName: doctorName,
      recipientRole: 'doctor',
      type: 'BOOKING_CONFIRMATION',
      subject: `New Patient Appointment: ${patientName} on ${appointmentDate} at ${startTime}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f766e;">New Patient Consultation Scheduled</h2>
          <p>Dear <strong>${doctorName}</strong>,</p>
          <p>A new consultation has been booked on your calendar.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 4px 0;"><strong>Patient:</strong> ${patientName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${startTime}</p>
            ${urgencyLevel ? `<p style="margin: 4px 0;"><strong>AI Triage Urgency:</strong> <span style="color: ${urgencyLevel === 'High' ? '#ef4444' : urgencyLevel === 'Medium' ? '#f59e0b' : '#10b981'}; font-weight: bold;">${urgencyLevel}</span></p>` : ''}
          </div>
          <p>Please log in to your Doctor Portal to review the AI Pre-Visit Symptom Summary prior to the visit.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
        </div>
      `,
      textContent: `New appointment: ${patientName} on ${appointmentDate} at ${startTime}. Urgency: ${urgencyLevel || 'Standard'}.`,
      metadata: { appointmentId, patientName, appointmentDate, startTime },
    });
  },

  async sendDoctorLeaveAlert(params: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    doctorSpecialisation: string;
    appointmentDate: string;
    startTime: string;
    reason: string;
    appointmentId: string;
  }) {
    const {
      patientEmail,
      patientName,
      doctorName,
      doctorSpecialisation,
      appointmentDate,
      startTime,
      reason,
      appointmentId,
    } = params;

    await this.sendEmail({
      to: patientEmail,
      recipientName: patientName,
      recipientRole: 'patient',
      type: 'DOCTOR_LEAVE_RESCHEDULE',
      subject: `Action Required: Reschedule Your Appointment with ${doctorName} on ${appointmentDate}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
          <h2 style="color: #dc2626;">Schedule Change Notice</h2>
          <p>Dear <strong>${patientName}</strong>,</p>
          <p>We regret to inform you that <strong>${doctorName}</strong> (${doctorSpecialisation}) will be away on scheduled leave on <strong>${appointmentDate}</strong> (${reason}).</p>
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 4px 0;"><strong>Original Time:</strong> ${appointmentDate} at ${startTime}</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p>We apologize for the inconvenience. Please open your Patient Portal to select a new convenient time slot or an alternate specialist with priority scheduling.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
        </div>
      `,
      textContent: `Schedule change notice: ${doctorName} is on leave on ${appointmentDate}. Please log in to your patient portal to reschedule your appointment.`,
      metadata: { appointmentId, doctorName, appointmentDate, reason },
    });
  },

  async sendCancellationNotice(params: {
    recipientEmail: string;
    recipientName: string;
    recipientRole: UserRole;
    doctorName: string;
    appointmentDate: string;
    startTime: string;
    reason?: string;
    appointmentId: string;
  }) {
    const { recipientEmail, recipientName, recipientRole, doctorName, appointmentDate, startTime, reason, appointmentId } = params;

    await this.sendEmail({
      to: recipientEmail,
      recipientName,
      recipientRole,
      type: 'APPOINTMENT_CANCELLED',
      subject: `Appointment Cancelled: Consultation on ${appointmentDate}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #64748b;">Appointment Cancelled</h2>
          <p>Hello <strong>${recipientName}</strong>,</p>
          <p>The appointment on <strong>${appointmentDate} at ${startTime}</strong> with ${doctorName} has been cancelled.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
        </div>
      `,
      textContent: `Appointment on ${appointmentDate} at ${startTime} with ${doctorName} has been cancelled.`,
      metadata: { appointmentId },
    });
  },

  async sendMedicationReminder(reminder: MedicationReminder) {
    await this.sendEmail({
      to: reminder.patientEmail,
      recipientName: reminder.patientName,
      recipientRole: 'patient',
      type: 'MEDICATION_REMINDER',
      subject: `Medication Reminder: Time to take ${reminder.medicineName} (${reminder.dosage})`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccfbf1; border-radius: 8px;">
          <h2 style="color: #0f766e;">Medication Reminder</h2>
          <p>Dear <strong>${reminder.patientName}</strong>,</p>
          <p>This is your scheduled dose reminder.</p>
          <div style="background-color: #f0fdfa; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #0d9488;">
            <p style="margin: 4px 0;"><strong>Medicine:</strong> ${reminder.medicineName}</p>
            <p style="margin: 4px 0;"><strong>Dosage:</strong> ${reminder.dosage}</p>
            <p style="margin: 4px 0;"><strong>Scheduled Time:</strong> ${reminder.scheduledTime}</p>
            <p style="margin: 4px 0;"><strong>Frequency:</strong> ${reminder.frequency}</p>
          </div>
          <p>Please take your medication as instructed with water. Stay consistent for the best therapeutic outcome.</p>
          <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Healthcare Appointment & Follow-up Manager</p>
        </div>
      `,
      textContent: `Medication Reminder: Time to take ${reminder.medicineName} (${reminder.dosage}) at ${reminder.scheduledTime}.`,
      metadata: { reminderId: reminder.id, medicine: reminder.medicineName },
    });
  },

  async retryFailedNotification(logId: string): Promise<NotificationLog | null> {
    const logs = dbStore.getNotificationLogs();
    const log = logs.find((l) => l.id === logId);
    if (!log) return null;

    const newRetryCount = (log.retryCount || 0) + 1;
    const updated = dbStore.updateNotificationLog(logId, {
      status: 'RETRIED',
      retryCount: newRetryCount,
      errorMessage: undefined,
      sentAt: new Date().toISOString(),
    });

    return updated;
  },

  async processMedicationRemindersCron(): Promise<{ processedCount: number; remindersSent: number }> {
    const activeReminders = dbStore.getMedicationReminders().filter((r) => r.status === 'ACTIVE');
    const today = new Date().toISOString().split('T')[0];
    let sentCount = 0;

    for (const reminder of activeReminders) {
      if (today >= reminder.startDate && today <= reminder.endDate) {
        await this.sendMedicationReminder(reminder);
        dbStore.updateMedicationReminder(reminder.id, {
          lastSentAt: new Date().toISOString(),
        });
        sentCount++;
      } else if (today > reminder.endDate) {
        dbStore.updateMedicationReminder(reminder.id, {
          status: 'COMPLETED',
        });
      }
    }

    return {
      processedCount: activeReminders.length,
      remindersSent: sentCount,
    };
  },
};
