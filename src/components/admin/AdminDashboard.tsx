'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile, Appointment, ClinicAnalytics, User } from '@/types';
import { DoctorLeaveModal } from './DoctorLeaveModal';
import {
  Users,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  CalendarOff,
  Stethoscope,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Mail,
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: User;
  doctors: DoctorProfile[];
  appointments: Appointment[];
  onRefreshData: () => void;
  onOpenNotifications: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  doctors,
  appointments,
  onRefreshData,
  onOpenNotifications,
}) => {
  const [analytics, setAnalytics] = useState<ClinicAnalytics | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialisation, setSpecialisation] = useState('Cardiology');
  const [fee, setFee] = useState('140');
  const [experience, setExperience] = useState('8');
  const [slotDuration, setSlotDuration] = useState('30');
  const [roomNumber, setRoomNumber] = useState('Suite 201');
  const [bio, setBio] = useState('');
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [appointments, doctors]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsSavingDoctor(true);

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          specialisation,
          consultationFee: Number(fee),
          experienceYears: Number(experience),
          slotDurationMinutes: Number(slotDuration),
          roomNumber,
          bio,
        }),
      });

      if (res.ok) {
        setIsAddDoctorOpen(false);
        setName('');
        setEmail('');
        setBio('');
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to create doctor', err);
    } finally {
      setIsSavingDoctor(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-300">
              Clinic Administration & Operations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Healthcare System Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mt-1">
            Manage physician schedules, doctor leave conflict resolution, slot duration profiles, and review real-time AI triage analytics.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-lg shadow-amber-600/20 active:scale-95 transition"
          >
            <CalendarOff className="h-4 w-4" />
            <span>Mark Doctor Leave</span>
          </button>

          <button
            onClick={() => setIsAddDoctorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Doctor Profile</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Appointments</span>
            <Calendar className="h-4 w-4 text-teal-500" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white block">
            {analytics?.totalAppointments || appointments.length}
          </span>
          <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            {analytics?.confirmedAppointments || 0} active / {analytics?.completedAppointments || 0} completed
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">AI High Urgency Visits</span>
            <Activity className="h-4 w-4 text-red-500" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-400 block">
            {analytics?.urgencyBreakdown.high || 0}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {analytics?.urgencyBreakdown.medium || 0} med • {analytics?.urgencyBreakdown.low || 0} low
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Leave Conflicts</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400 block">
            {analytics?.rescheduleRequiredCount || 0}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
            Auto-notified for reschedule
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Email Delivery Rate</span>
            <Mail className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white block">
            {analytics?.notificationDeliveryRate || 100}%
          </span>
          <button
            onClick={onOpenNotifications}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            Inspect Outbox & Logs →
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Physician Profiles & Schedule Durations
            </h2>
            <p className="text-xs text-slate-500">
              Configure working hours, appointment slot durations, and active leave periods.
            </p>
          </div>

          <button
            onClick={onRefreshData}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => {
            const hasLeaves = (doctor.leaveDays || []).length > 0;

            return (
              <div
                key={doctor.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={doctor.avatarUrl}
                      alt={doctor.name}
                      className="h-14 w-14 rounded-2xl object-cover ring-2 ring-teal-500/20"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {doctor.name}
                      </h3>
                      <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                        {doctor.specialisation}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{doctor.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot Duration</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {doctor.slotDurationMinutes} minutes
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Consult Fee</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ${doctor.consultationFee}
                      </span>
                    </div>
                  </div>

                  {hasLeaves && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                        <CalendarOff className="h-3.5 w-3.5 text-amber-600" />
                        <span>Scheduled Leave</span>
                      </div>
                      {doctor.leaveDays.map((l) => (
                        <div key={l.id} className="text-amber-900 dark:text-amber-200">
                          {l.startDate} to {l.endDate} ({l.reason})
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{doctor.roomNumber}</span>
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition border border-amber-200/80 dark:border-amber-800/60"
                  >
                    <CalendarOff className="h-3.5 w-3.5" />
                    <span>Set Leave</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Specialist Physician Profile
              </h3>
              <button
                onClick={() => setIsAddDoctorOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="Dr. Jordan Hayes, MD"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    placeholder="dr.hayes@healthmanager.clinic"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Specialisation</label>
                  <select
                    value={specialisation}
                    onChange={(e) => setSpecialisation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option>Cardiology</option>
                    <option>Dermatology</option>
                    <option>Neurology</option>
                    <option>Pediatrics</option>
                    <option>Orthopedics</option>
                    <option>General Medicine</option>
                    <option>Endocrinology</option>
                    <option>Gastroenterology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Fee ($)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Slot Mins</label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="15">15 mins</option>
                    <option value="20">20 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                    <option value="60">60 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Room #</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">Bio / Expertise</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Specialist clinical background..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoctor}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {isSavingDoctor ? 'Saving...' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DoctorLeaveModal
        doctors={doctors}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeaveApplied={() => onRefreshData()}
      />
    </div>
  );
};
