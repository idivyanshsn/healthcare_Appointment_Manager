import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { calendarService } from '@/lib/calendar-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');
    const format = searchParams.get('format') || 'url';

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'appointmentId query parameter required' },
        { status: 400 }
      );
    }

    const appointment = dbStore.getAppointmentById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    if (format === 'ics') {
      const icsContent = calendarService.generateIcsFileContent(appointment);
      return new NextResponse(icsContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="appointment-${appointment.id}.ics"`,
        },
      });
    }

    const googleWebUrl = calendarService.generateGoogleCalendarWebUrl(appointment);
    return NextResponse.json({
      success: true,
      googleWebUrl,
      icsDownloadUrl: `/api/calendar?appointmentId=${appointment.id}&format=ics`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, accessToken } = body;

    if (!appointmentId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'appointmentId and accessToken are required' },
        { status: 400 }
      );
    }

    const appointment = dbStore.getAppointmentById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    const res = await calendarService.createGoogleCalendarApiEvent(accessToken, appointment);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    dbStore.updateAppointment(appointmentId, {
      googleCalendarEventId: res.eventId,
      googleCalendarHtmlLink: res.htmlLink,
    });

    return NextResponse.json({
      success: true,
      eventId: res.eventId,
      htmlLink: res.htmlLink,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
