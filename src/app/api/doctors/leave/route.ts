import { NextRequest, NextResponse } from 'next/server';
import { leaveManager } from '@/lib/leave-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorId, startDate, endDate, reason, previewOnly } = body;

    if (!doctorId || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters (doctorId, startDate, endDate)' },
        { status: 400 }
      );
    }

    if (previewOnly) {
      const conflicts = leaveManager.previewLeaveConflicts(doctorId, startDate, endDate);
      return NextResponse.json({ success: true, conflicts, count: conflicts.length });
    }

    const result = await leaveManager.applyDoctorLeave({
      doctorId,
      startDate,
      endDate,
      reason: reason || 'Scheduled Leave / Medical Conference',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      leave: result.leave,
      affectedAppointmentsCount: result.affectedAppointments.length,
      notifiedPatientsCount: result.notifiedPatientsCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
