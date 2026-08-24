'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile, Appointment } from '@/types';
import {
  X,
  Calendar,
  AlertTriangle,
  Mail,
  CheckCircle2,
  Clock,
  UserCheck,
  CalendarOff,
} from 'lucide-react';

interface DoctorLeaveModalProps {
  doctors: DoctorProfile[];
  isOpen: boolean;
  onClose: () => void;
  onLeaveApplied: () => void;
}

export const DoctorLeaveModal: React.FC<DoctorLeaveModalProps> = ({
  doctors,
  isOpen,
  onClose,
  onLeaveApplied,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState('Medical Conference / Continuing Education');

  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !selectedDoctorId || !startDate || !endDate) return;

    const fetchConflicts = async () => {
      setLoadingConflicts(true);
      try {
        const res = await fetch(
          `/api/doctors/leave`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              doctorId: selectedDoctorId,
              startDate,
              endDate,
              previewOnly: true,
            }),
          }
        );
        const data = await res.json();
        if (data.success) {
          setConflicts(data.conflicts || []);
        }
      } catch (err) {
        console.error('Failed to preview conflicts', err);
      } finally {
        setLoadingConflicts(false);
      }
    };

    fetchConflicts();
  }, [isOpen, selectedDoctorId, startDate, endDate]);

  if (!isOpen) return null;

  const handleApplyLeave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/doctors/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          startDate,
          endDate,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          `Doctor leave scheduled. ${data.affectedAppointmentsCount || 0} conflicting patient appointments were flagged for rescheduling, and priority email alerts were dispatched.`
        );
        setTimeout(() => {
          onLeaveApplied();
          onClose();
        }, 2200);
      } else {
        setError(data.error || 'Failed to record doctor leave');
      }
    } catch (err: any) {
      setError(err.message || 'Network error applying leave');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-300">
              <CalendarOff className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Schedule Doctor Leave
              </h2>
              <p className="text-xs text-slate-500">
                Automated booking conflict detection and patient notification dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2 animate-slide-up">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Select Physician
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialisation})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Leave Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Leave End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Leave Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual Leave, Conference, Medical Emergency"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Existing Bookings in Selected Range</span>
              </span>
              <span className="font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {conflicts.length} Conflicting
              </span>
            </div>

            {loadingConflicts ? (
              <p className="text-slate-500 italic">Checking appointment conflicts...</p>
            ) : conflicts.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                ✓ No existing patient appointments booked on these dates. Slots will be blocked cleanly.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {c.patientName}
                      </span>
                      <span className="text-slate-500 ml-2">
                        ({c.appointmentDate} at {c.startTime})
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                      Auto-Notify
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting || !!successMessage}
            onClick={handleApplyLeave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 active:scale-95"
          >
            <CalendarOff className="h-4 w-4" />
            <span>Confirm Leave & Dispatch Patient Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};
