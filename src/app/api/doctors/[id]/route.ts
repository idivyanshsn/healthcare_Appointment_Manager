import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doctor = dbStore.getDoctorById(params.id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = dbStore.updateDoctor(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Doctor not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, doctor: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
