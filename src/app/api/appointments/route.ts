import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { slotManager } from '@/lib/slot-manager';
import { notificationService } from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    let appointments = dbStore.getAppointments();
    if (patientId) {
      appointments = appointments.filter((a) => a.patientId === patientId);
    }
    if (doctorId) {
      appointments = appointments.filter((a) => a.doctorId === doctorId);
    }

    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
      consultationType,
      preVisitSummary,
      patientName,
      patientEmail,
      patientPhone,
    } = body;

    if (!doctorId || !patientId || !appointmentDate || !startTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required booking details.' },
        { status: 400 }
      );
    }

    const claimCheck = slotManager.validateAndClaimSlot({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
    });

    if (!claimCheck.valid) {
      return NextResponse.json({ success: false, error: claimCheck.error }, { status: 409 });
    }

    const doctor = dbStore.getDoctorById(doctorId);
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Physician profile not found.' }, { status: 404 });
    }

    const patient = dbStore.getUserById(patientId);

    const newAppointment = dbStore.createAppointment({
      doctorId,
      patientId,
      doctorName: doctor.name,
      doctorSpecialisation: doctor.specialisation,
      patientName: patientName || patient?.name || 'Valued Patient',
      patientEmail: patientEmail || patient?.email || 'patient@example.com',
      patientPhone: patientPhone || patient?.phone || '+1 (555) 000-0000',
      appointmentDate,
      startTime,
      endTime: endTime || startTime,
      status: 'CONFIRMED',
      consultationType: consultationType || 'IN_PERSON',
      roomNumber: doctor.roomNumber,
      fee: doctor.consultationFee,
      preVisitSummary: preVisitSummary || undefined,
    });

    dbStore.releasePatientHolds(patientId);

    try {
      await notificationService.sendBookingConfirmation({
        patientEmail: newAppointment.patientEmail,
        patientName: newAppointment.patientName,
        doctorEmail: doctor.email,
        doctorName: doctor.name,
        doctorSpecialisation: doctor.specialisation,
        appointmentDate: newAppointment.appointmentDate,
        startTime: newAppointment.startTime,
        roomNumber: doctor.roomNumber,
        urgencyLevel: preVisitSummary?.urgencyLevel,
        appointmentId: newAppointment.id,
      });
    } catch (notifErr) {
      console.warn('[Appointments] Failed to trigger async email notifications:', notifErr);
    }

    return NextResponse.json({ success: true, appointment: newAppointment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
