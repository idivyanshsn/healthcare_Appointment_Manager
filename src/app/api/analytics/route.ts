import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET() {
  try {
    const analytics = dbStore.getAnalytics();
    return NextResponse.json({ success: true, analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
