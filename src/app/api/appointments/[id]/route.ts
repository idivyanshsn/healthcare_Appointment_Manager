import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { notificationService } from '@/lib/notification-service';
import { llmService } from '@/lib/llm-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const appointment = dbStore.getAppointmentById(params.id);
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, doctorNotes, prescriptions, cancellationReason, status } = body;

    const existing = dbStore.getAppointmentById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (action === 'COMPLETE_CONSULTATION') {
      const postVisitSummary = await llmService.generatePostVisitSummary(
        doctorNotes || 'Consultation completed routinely.',
        prescriptions
      );

      const updated = dbStore.updateAppointment(params.id, {
        status: 'COMPLETED',
        postVisitSummary,
      });

      if (postVisitSummary.medicationSchedule && postVisitSummary.medicationSchedule.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        postVisitSummary.medicationSchedule.forEach((med) => {
          const endDateObj = new Date();
          endDateObj.setDate(endDateObj.getDate() + (med.durationDays || 7));
          const endDate = endDateObj.toISOString().split('T')[0];

          (med.scheduledTimes || ['08:00 AM']).forEach((time) => {
            dbStore.createMedicationReminder({
              appointmentId: existing.id,
              patientId: existing.patientId,
              patientName: existing.patientName,
              patientEmail: existing.patientEmail,
              medicineName: med.medicineName,
              dosage: med.dosage,
              scheduledTime: time,
              frequency: med.frequency,
              startDate: today,
              endDate,
              nextScheduledAt: `${today} ${time}`,
              status: 'ACTIVE',
            });
          });
        });
      }

      return NextResponse.json({ success: true, appointment: updated, postVisitSummary });
    }

    if (action === 'CANCEL') {
      const updated = dbStore.updateAppointment(params.id, {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled by user',
      });

      await notificationService.sendCancellationNotice({
        recipientEmail: existing.patientEmail,
        recipientName: existing.patientName,
        recipientRole: 'patient',
        doctorName: existing.doctorName,
        appointmentDate: existing.appointmentDate,
        startTime: existing.startTime,
        reason: cancellationReason,
        appointmentId: existing.id,
      });

      return NextResponse.json({ success: true, appointment: updated });
    }

    const updated = dbStore.updateAppointment(params.id, body);
    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
