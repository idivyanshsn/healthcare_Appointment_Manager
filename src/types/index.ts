export type UserRole = 'patient' | 'doctor' | 'admin';

export type UrgencyLevel = 'Low' | 'Medium' | 'High';

export type AppointmentStatus =
  | 'HELD'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULE_NEEDED';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'HELD_BY_YOU' | 'HELD_BY_OTHER' | 'BOOKED' | 'ON_LEAVE';
  holdExpiresAt?: number;
  holdId?: string;
  isAvailable: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface WorkingHour {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string;
  specialisation: string;
  experienceYears: number;
  consultationFee: number;
  rating: number;
  reviewCount: number;
  roomNumber: string;
  bio: string;
  slotDurationMinutes: number;
  workingHours: WorkingHour[];
  leaveDays: DoctorLeave[];
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
  affectedAppointmentsCount?: number;
}

export interface SlotHold {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  expiresAt: number;
  createdAt: number;
}

export interface PreVisitSummary {
  urgencyLevel: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  analyzedAt: string;
  symptomsRaw: string;
  vitalSigns?: {
    temperature?: string;
    bloodPressure?: string;
    heartRate?: string;
  };
}

export interface MedicationScheduleItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
  scheduledTimes: string[];
  takenLog?: Record<string, boolean>;
}

export interface PostVisitSummary {
  clinicalDiagnosis: string;
  patientFriendlyExplanation: string;
  medicationSchedule: MedicationScheduleItem[];
  followUpSteps: string[];
  warningSigns: string[];
  nextVisitRecommendation?: string;
  generatedAt: string;
  doctorNotesRaw: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName: string;
  doctorSpecialisation: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  consultationType: 'IN_PERSON' | 'TELE_CONSULT';
  roomNumber?: string;
  fee: number;
  preVisitSummary?: PreVisitSummary;
  postVisitSummary?: PostVisitSummary;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  cancellationReason?: string;
  rescheduleNoticeSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  frequency: string;
  startDate: string;
  endDate: string;
  lastSentAt?: string;
  nextScheduledAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: UserRole;
  type:
    | 'BOOKING_CONFIRMATION'
    | 'APPOINTMENT_REMINDER'
    | 'APPOINTMENT_CANCELLED'
    | 'DOCTOR_LEAVE_RESCHEDULE'
    | 'MEDICATION_REMINDER'
    | 'POST_VISIT_SUMMARY';
  subject: string;
  content: string;
  status: 'SENT' | 'FAILED' | 'PENDING' | 'RETRIED';
  retryCount: number;
  errorMessage?: string;
  sentAt: string;
  metadata?: Record<string, unknown>;
}

export interface ClinicAnalytics {
  totalAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  rescheduleRequiredCount: number;
  totalDoctors: number;
  totalPatients: number;
  urgencyBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  specialisationBreakdown: Record<string, number>;
  notificationDeliveryRate: number;
}
