import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const count = dbStore.cleanupExpiredHolds();
    return NextResponse.json({
      success: true,
      cleanedExpiredHoldsCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
