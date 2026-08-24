import { NextRequest, NextResponse } from 'next/server';
import { slotManager } from '@/lib/slot-manager';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const patientId = searchParams.get('patientId') || undefined;

    const result = slotManager.getDoctorSlotsForDate(params.id, date, patientId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
