import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { notificationService } from '@/lib/notification-service';

export async function GET() {
  try {
    const logs = dbStore.getNotificationLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, logId } = body;

    if (action === 'retry' && logId) {
      const updated = await notificationService.retryFailedNotification(logId);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Log not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, log: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid notification action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
