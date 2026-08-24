import { NextRequest, NextResponse } from 'next/server';
import { slotManager } from '@/lib/slot-manager';
import { dbStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { doctorId, patientId, appointmentDate, startTime, endTime, action } = body;

    if (action === 'RELEASE') {
      const { holdId } = body;
      if (holdId) {
        dbStore.releaseSlotHold(holdId);
      } else if (patientId) {
        dbStore.releasePatientHolds(patientId);
      }
      return NextResponse.json({ success: true, message: 'Slot hold released' });
    }

    if (!doctorId || !patientId || !appointmentDate || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required hold parameters (doctorId, patientId, appointmentDate, startTime, endTime)',
        },
        { status: 400 }
      );
    }

    const result = slotManager.acquireSlotHold({
      doctorId,
      patientId,
      appointmentDate,
      startTime,
      endTime,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      hold: result.hold,
      expiresAt: result.hold?.expiresAt,
      holdDurationMinutes: 10,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
