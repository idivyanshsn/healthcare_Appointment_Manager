import fs from 'fs';
import path from 'path';
import {
  DoctorProfile,
  Appointment,
  SlotHold,
  User,
  MedicationReminder,
  NotificationLog,
  ClinicAnalytics,
  DoctorLeave,
} from '../types';
import {
  SEED_USERS,
  SEED_DOCTORS,
  SEED_APPOINTMENTS,
  SEED_MEDICATION_REMINDERS,
  SEED_NOTIFICATION_LOGS,
} from './seed-data';

interface DatabaseSchema {
  users: User[];
  doctors: DoctorProfile[];
  appointments: Appointment[];
  slotHolds: SlotHold[];
  medicationReminders: MedicationReminder[];
  notificationLogs: NotificationLog[];
}

let memoryDb: DatabaseSchema | null = null;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function initializeInitialData(): DatabaseSchema {
  return {
    users: JSON.parse(JSON.stringify(SEED_USERS)),
    doctors: JSON.parse(JSON.stringify(SEED_DOCTORS)),
    appointments: JSON.parse(JSON.stringify(SEED_APPOINTMENTS)),
    slotHolds: [],
    medicationReminders: JSON.parse(JSON.stringify(SEED_MEDICATION_REMINDERS)),
    notificationLogs: JSON.parse(JSON.stringify(SEED_NOTIFICATION_LOGS)),
  };
}

function loadData(): DatabaseSchema {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb!;
    }
  } catch (err) {
    console.warn('[Store] Could not read file, fallback to memory database:', err);
  }
  memoryDb = initializeInitialData();
  saveData(memoryDb);
  return memoryDb;
}

function saveData(db: DatabaseSchema): void {
  memoryDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Store] Could not persist to disk, running in serverless memory mode:', err);
  }
}

export const dbStore = {
  resetToSeed(): void {
    memoryDb = initializeInitialData();
    saveData(memoryDb);
  },
  getUsers(): User[] {
    return loadData().users;
  },
  getUserById(id: string): User | undefined {
    return loadData().users.find((u) => u.id === id);
  },
  getDoctors(): DoctorProfile[] {
    return loadData().doctors;
  },
  getDoctorById(id: string): DoctorProfile | undefined {
    return loadData().doctors.find((d) => d.id === id);
  },
  createDoctor(doctor: Omit<DoctorProfile, 'id'>): DoctorProfile {
    const db = loadData();
    const newDoc: DoctorProfile = {
      ...doctor,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leaveDays: doctor.leaveDays || [],
    };
    db.doctors.push(newDoc);
    saveData(db);
    return newDoc;
  },
  updateDoctor(id: string, updates: Partial<DoctorProfile>): DoctorProfile | null {
    const db = loadData();
    const idx = db.doctors.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    db.doctors[idx] = { ...db.doctors[idx], ...updates };
    saveData(db);
    return db.doctors[idx];
  },
  addDoctorLeave(doctorId: string, leave: Omit<DoctorLeave, 'id' | 'createdAt' | 'doctorId'>): DoctorLeave | null {
    const db = loadData();
    const doc = db.doctors.find((d) => d.id === doctorId);
    if (!doc) return null;
    const newLeave: DoctorLeave = {
      ...leave,
      id: `leave_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      doctorId,
      createdAt: new Date().toISOString(),
    };
    if (!doc.leaveDays) doc.leaveDays = [];
    doc.leaveDays.push(newLeave);
    saveData(db);
    return newLeave;
  },
  getAppointments(): Appointment[] {
    return loadData().appointments;
  },
  getAppointmentById(id: string): Appointment | undefined {
    return loadData().appointments.find((a) => a.id === id);
  },
  getAppointmentsByPatient(patientId: string): Appointment[] {
    return loadData().appointments.filter((a) => a.patientId === patientId);
  },
  getAppointmentsByDoctor(doctorId: string): Appointment[] {
    return loadData().appointments.filter((a) => a.doctorId === doctorId);
  },
  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
    const db = loadData();
    const newApt: Appointment = {
      ...appointment,
      id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.appointments.push(newApt);
    saveData(db);
    return newApt;
  },
  updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
    const db = loadData();
    const idx = db.appointments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    db.appointments[idx] = {
      ...db.appointments[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveData(db);
    return db.appointments[idx];
  },
  getSlotHolds(): SlotHold[] {
    const now = Date.now();
    const db = loadData();
    return db.slotHolds.filter((h) => h.expiresAt > now);
  },
  createSlotHold(hold: Omit<SlotHold, 'id' | 'createdAt'>): SlotHold {
    const db = loadData();
    const now = Date.now();
    db.slotHolds = db.slotHolds.filter((h) => h.expiresAt > now);
    const newHold: SlotHold = {
      ...hold,
      id: `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    db.slotHolds.push(newHold);
    saveData(db);
    return newHold;
  },
  releaseSlotHold(holdId: string): void {
    const db = loadData();
    db.slotHolds = db.slotHolds.filter((h) => h.id !== holdId);
    saveData(db);
  },
  releasePatientHolds(patientId: string): void {
    const db = loadData();
    db.slotHolds = db.slotHolds.filter((h) => h.patientId !== patientId);
    saveData(db);
  },
  cleanupExpiredHolds(): number {
    const db = loadData();
    const now = Date.now();
    const initialCount = db.slotHolds.length;
    db.slotHolds = db.slotHolds.filter((h) => h.expiresAt > now);
    const cleanedCount = initialCount - db.slotHolds.length;
    if (cleanedCount > 0) saveData(db);
    return cleanedCount;
  },
  getMedicationReminders(patientId?: string): MedicationReminder[] {
    const db = loadData();
    if (patientId) return db.medicationReminders.filter((r) => r.patientId === patientId);
    return db.medicationReminders;
  },
  createMedicationReminder(reminder: Omit<MedicationReminder, 'id'>): MedicationReminder {
    const db = loadData();
    const newReminder: MedicationReminder = {
      ...reminder,
      id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    db.medicationReminders.push(newReminder);
    saveData(db);
    return newReminder;
  },
  updateMedicationReminder(id: string, updates: Partial<MedicationReminder>): MedicationReminder | null {
    const db = loadData();
    const idx = db.medicationReminders.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    db.medicationReminders[idx] = { ...db.medicationReminders[idx], ...updates };
    saveData(db);
    return db.medicationReminders[idx];
  },
  getNotificationLogs(): NotificationLog[] {
    return loadData().notificationLogs;
  },
  createNotificationLog(log: Omit<NotificationLog, 'id' | 'sentAt'>): NotificationLog {
    const db = loadData();
    const newLog: NotificationLog = {
      ...log,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sentAt: new Date().toISOString(),
    };
    db.notificationLogs.unshift(newLog);
    saveData(db);
    return newLog;
  },
  updateNotificationLog(id: string, updates: Partial<NotificationLog>): NotificationLog | null {
    const db = loadData();
    const idx = db.notificationLogs.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    db.notificationLogs[idx] = { ...db.notificationLogs[idx], ...updates };
    saveData(db);
    return db.notificationLogs[idx];
  },
  getAnalytics(): ClinicAnalytics {
    const db = loadData();
    const appointments = db.appointments;
    const doctors = db.doctors;
    const logs = db.notificationLogs;
    const urgencyBreakdown = { low: 0, medium: 0, high: 0 };
    const specialisationBreakdown: Record<string, number> = {};
    let confirmedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let rescheduleRequiredCount = 0;
    for (const apt of appointments) {
      if (apt.status === 'CONFIRMED') confirmedCount++;
      if (apt.status === 'COMPLETED') completedCount++;
      if (apt.status === 'CANCELLED') cancelledCount++;
      if (apt.status === 'RESCHEDULE_NEEDED') rescheduleRequiredCount++;
      const spec = apt.doctorSpecialisation || 'General';
      specialisationBreakdown[spec] = (specialisationBreakdown[spec] || 0) + 1;
      if (apt.preVisitSummary?.urgencyLevel) {
        const lvl = apt.preVisitSummary.urgencyLevel.toLowerCase();
        if (lvl === 'low') urgencyBreakdown.low++;
        else if (lvl === 'medium') urgencyBreakdown.medium++;
        else if (lvl === 'high') urgencyBreakdown.high++;
      }
    }
    const successfulLogs = logs.filter((l) => l.status === 'SENT' || l.status === 'RETRIED').length;
    const deliveryRate = logs.length > 0 ? Math.round((successfulLogs / logs.length) * 100) : 100;
    return {
      totalAppointments: appointments.length,
      confirmedAppointments: confirmedCount,
      completedAppointments: completedCount,
      cancelledAppointments: cancelledCount,
      rescheduleRequiredCount,
      totalDoctors: doctors.length,
      totalPatients: db.users.filter((u) => u.role === 'patient').length,
      urgencyBreakdown,
      specialisationBreakdown,
      notificationDeliveryRate: deliveryRate,
    };
  },
};
