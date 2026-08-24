'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DoctorSearch } from '@/components/patient/DoctorSearch';
import { BookingModal } from '@/components/patient/BookingModal';
import { PatientDashboard } from '@/components/patient/PatientDashboard';
import { DoctorDashboard } from '@/components/doctor/DoctorDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { NotificationDrawer } from '@/components/admin/NotificationDrawer';
import { DoctorProfile, Appointment, User, UserRole } from '@/types';
import { SEED_USERS } from '@/lib/seed-data';
import { Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);
  const [activeRole, setActiveRole] = useState<UserRole>('patient');
  const [activeTab, setActiveTab] = useState<'book' | 'appointments' | 'prescriptions'>('book');

  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [docRes, aptRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/appointments'),
      ]);
      const docData = await docRes.json();
      const aptData = await aptRes.json();

      if (docData.success) setDoctors(docData.doctors);
      if (aptData.success) setAppointments(aptData.appointments);
    } catch (err) {
      console.error('Failed to load initial clinical data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    const userForRole = SEED_USERS.find((u) => u.role === role) || SEED_USERS[0];
    setCurrentUser(userForRole);
    if (role === 'patient') {
      setActiveTab('book');
    }
  };

  const handleOpenBooking = (doctor: DoctorProfile) => {
    setSelectedDoctor(doctor);
    setIsBookingOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={handleRoleSwitch}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
      />

      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-teal-600 text-white shadow-xl border border-teal-400/30 text-xs font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-200" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="h-10 w-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">
              Synchronizing clinical workspaces & schedule state...
            </p>
          </div>
        ) : (
          <>
            {activeRole === 'patient' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setActiveTab('book')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'book'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    Find Specialists & Book
                  </button>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      activeTab === 'appointments'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    My Consultations & Timeline (
                    {appointments.filter((a) => a.patientId === currentUser.id).length})
                  </button>
                </div>

                {activeTab === 'book' && (
                  <DoctorSearch
                    doctors={doctors}
                    onSelectDoctor={handleOpenBooking}
                  />
                )}

                {activeTab === 'appointments' && (
                  <PatientDashboard
                    patientUser={currentUser}
                    appointments={appointments.filter((a) => a.patientId === currentUser.id)}
                    onRefreshData={fetchInitialData}
                    onBookNew={() => setActiveTab('book')}
                  />
                )}
              </div>
            )}

            {activeRole === 'doctor' && (
              <DoctorDashboard
                doctorUser={currentUser}
                doctors={doctors}
                appointments={appointments}
                onRefreshData={fetchInitialData}
              />
            )}

            {activeRole === 'admin' && (
              <AdminDashboard
                adminUser={currentUser}
                doctors={doctors}
                appointments={appointments}
                onRefreshData={fetchInitialData}
                onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
              />
            )}
          </>
        )}
      </main>

      <BookingModal
        doctor={selectedDoctor}
        currentUser={currentUser}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDoctor(null);
        }}
        onBookingSuccess={() => {
          fetchInitialData();
          showToast('Appointment successfully confirmed! Google Calendar sync is ready.');
          setActiveTab('appointments');
        }}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          CarePulse AI — Clinical Consultation & Medication Follow-up Manager • Built with Next.js 14
        </p>
      </footer>
    </div>
  );
}
