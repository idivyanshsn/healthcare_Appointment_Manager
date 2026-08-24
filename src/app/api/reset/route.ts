import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export async function POST() {
  try {
    dbStore.resetToSeed();
    return NextResponse.json({
      success: true,
      message: 'Database reset to initial clinical demonstration state.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
