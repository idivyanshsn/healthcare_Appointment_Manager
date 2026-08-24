import { Appointment } from '../types';

export const calendarService = {
  generateGoogleCalendarWebUrl(appointment: Appointment): string {
    const title = encodeURIComponent(
      `Medical Consultation: ${appointment.doctorName} (${appointment.doctorSpecialisation})`
    );

    const [startH, startM] = appointment.startTime.split(':').map(Number);
    const [endH, endM] = appointment.endTime.split(':').map(Number);

    const startDate = new Date(`${appointment.appointmentDate}T00:00:00Z`);
    startDate.setUTCHours(startH, startM, 0, 0);

    const endDate = new Date(`${appointment.appointmentDate}T00:00:00Z`);
    endDate.setUTCHours(endH, endM, 0, 0);

    const formatCalDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '');

    const dates = `${formatCalDate(startDate)}/${formatCalDate(endDate)}`;

    const details = encodeURIComponent(
      `Patient: ${appointment.patientName}\nDoctor: ${appointment.doctorName}\nSpecialisation: ${appointment.doctorSpecialisation}\nLocation: ${appointment.roomNumber || 'Clinic Suite'}\nAppointment ID: ${appointment.id}\nStatus: ${appointment.status}\n\nManaged via Healthcare Appointment & Follow-up Manager.`
    );

    const location = encodeURIComponent(appointment.roomNumber || 'Healthcare Medical Center');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  },

  generateIcsFileContent(appointment: Appointment): string {
    const [startH, startM] = appointment.startTime.split(':').map(Number);
    const [endH, endM] = appointment.endTime.split(':').map(Number);

    const startDate = new Date(`${appointment.appointmentDate}T00:00:00Z`);
    startDate.setUTCHours(startH, startM, 0, 0);

    const endDate = new Date(`${appointment.appointmentDate}T00:00:00Z`);
    endDate.setUTCHours(endH, endM, 0, 0);

    const formatIcsDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '');

    const uid = `${appointment.id}@healthmanager.clinic`;
    const dtStamp = formatIcsDate(new Date());
    const dtStart = formatIcsDate(startDate);
    const dtEnd = formatIcsDate(endDate);

    const summary = `Doctor Consultation: ${appointment.doctorName} (${appointment.doctorSpecialisation})`;
    const description = `Patient: ${appointment.patientName}\\nDoctor: ${appointment.doctorName}\\nSpecialisation: ${appointment.doctorSpecialisation}\\nLocation: ${appointment.roomNumber || 'Medical Center'}\\nAppointment ID: ${appointment.id}`;
    const location = appointment.roomNumber || 'Healthcare Medical Center';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Healthcare Appointment Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },

  getGoogleOAuthUrl(state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'DEMO_CLIENT_ID.apps.googleusercontent.com';
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/callback';
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
  },

  async createGoogleCalendarApiEvent(accessToken: string, appointment: Appointment) {
    const [startH, startM] = appointment.startTime.split(':').map(Number);
    const [endH, endM] = appointment.endTime.split(':').map(Number);

    const startDateTime = `${appointment.appointmentDate}T${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}:00`;
    const endDateTime = `${appointment.appointmentDate}T${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;

    const eventPayload = {
      summary: `Consultation with ${appointment.doctorName} (${appointment.doctorSpecialisation})`,
      description: `Healthcare Appointment for ${appointment.patientName}. Pre-visit triage notes available in clinical portal.`,
      location: appointment.roomNumber || 'Clinic Suite',
      start: {
        dateTime: `${startDateTime}Z`,
        timeZone: 'UTC',
      },
      end: {
        dateTime: `${endDateTime}Z`,
        timeZone: 'UTC',
      },
      attendees: [
        { email: appointment.patientEmail, displayName: appointment.patientName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, eventId: data.id, htmlLink: data.htmlLink };
      }
      const err = await res.json();
      return { success: false, error: err };
    } catch (e: any) {
      return { success: false, error: e?.message };
    }
  },
};
