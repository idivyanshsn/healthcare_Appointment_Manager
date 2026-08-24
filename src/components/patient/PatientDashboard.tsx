'use client';

import React, { useState } from 'react';
import { Appointment, User } from '@/types';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CalendarPlus,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Pill,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

interface PatientDashboardProps {
  patientUser: User;
  appointments: Appointment[];
  onRefreshData: () => void;
  onBookNew: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientUser,
  appointments,
  onRefreshData,
  onBookNew,
}) => {
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedAptId((prev) => (prev === id ? null : id));
  };

  const handleCancelAppointment = async (aptId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(aptId);
    try {
      const res = await fetch(`/api/appointments/${aptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', cancellationReason: 'Cancelled by patient' }),
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to cancel appointment', err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownloadIcs = (aptId: string) => {
    window.open(`/api/calendar?appointmentId=${aptId}&format=ics`, '_blank');
  };

  const handleSyncGoogleCalendar = async (apt: Appointment) => {
    try {
      const res = await fetch(`/api/calendar?appointmentId=${apt.id}&format=url`);
      const data = await res.json();
      if (data.googleWebUrl) {
        window.open(data.googleWebUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to generate calendar URL', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100">
            Consultation History & Care Timeline
          </h2>
          <p className="text-xs text-slate-400">
            View upcoming visits, AI pre-visit insights, post-visit clinical summaries, and Google Calendar sync.
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition"
        >
          <Calendar className="h-4 w-4" />
          <span>Book New Visit</span>
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No appointments scheduled yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Find an experienced physician across cardiology, dermatology, neurology, or general medicine.
          </p>
          <button
            onClick={onBookNew}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md"
          >
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const isExpanded = expandedAptId === apt.id;
            const isConfirmed = apt.status === 'CONFIRMED';
            const isCompleted = apt.status === 'COMPLETED';
            const isCancelled = apt.status === 'CANCELLED';
            const isRescheduleNeeded = apt.status === 'RESCHEDULE_NEEDED';
            const urgency = apt.preVisitSummary?.urgencyLevel || 'Low';

            return (
              <div
                key={apt.id}
                className={`rounded-3xl border transition-all ${
                  isRescheduleNeeded
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : isCompleted
                    ? 'border-slate-800 bg-slate-900/80'
                    : 'border-slate-800 bg-slate-900'
                } p-5 space-y-4 shadow-lg`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-100">
                        {apt.doctorName}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {apt.doctorSpecialisation}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCompleted
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : isRescheduleNeeded
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {apt.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-teal-400" />
                        {apt.appointmentDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-teal-400" />
                        {apt.startTime} - {apt.endTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {apt.roomNumber || 'Clinic Suite'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-300 font-semibold">${apt.fee}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isConfirmed && (
                      <>
                        <button
                          onClick={() => handleSyncGoogleCalendar(apt)}
                          title="Add to Google Calendar"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                        >
                          <CalendarPlus className="h-3.5 w-3.5 text-teal-400" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          onClick={() => handleDownloadIcs(apt.id)}
                          title="Download iCal (.ics) file"
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleCancelAppointment(apt.id)}
                          disabled={cancellingId === apt.id}
                          className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold border border-red-800/40 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {isRescheduleNeeded && (
                      <button
                        onClick={onBookNew}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reschedule Now</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(apt.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isRescheduleNeeded && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Doctor Leave Schedule Notice</p>
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        {apt.cancellationReason || 'The doctor has marked leave on this date'}. Please select an alternate date with priority booking.
                      </p>
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className="pt-4 border-t border-slate-800 space-y-4 animate-fade-in text-xs">
                    {apt.preVisitSummary && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-teal-400" /> AI Pre-Visit Triage Summary
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              urgency === 'High'
                                ? 'urgency-badge-high'
                                : urgency === 'Medium'
                                ? 'urgency-badge-medium'
                                : 'urgency-badge-low'
                            }`}
                          >
                            {urgency} Urgency
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500">Chief Complaint:</span>
                          <p className="text-slate-300 font-medium">{apt.preVisitSummary.chiefComplaint}</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500">Suggested Questions for Physician:</span>
                          <ul className="list-disc list-inside text-slate-400 space-y-1 mt-1">
                            {apt.preVisitSummary.suggestedQuestions.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {isCompleted && apt.postVisitSummary && (
                      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 space-y-3">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                          <FileText className="h-4 w-4" />
                          <span>Doctor Consultation Summary & Prescriptions</span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-blue-300">Clinical Assessment:</span>
                          <p className="text-slate-200 font-bold mt-0.5">{apt.postVisitSummary.clinicalDiagnosis}</p>
                          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                            {apt.postVisitSummary.patientFriendlyExplanation}
                          </p>
                        </div>

                        {apt.postVisitSummary.medicationSchedule.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-blue-900/40">
                            <span className="text-[10px] uppercase font-bold text-blue-300 flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5 text-teal-400" /> Prescribed Medication Regimen:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {apt.postVisitSummary.medicationSchedule.map((med) => (
                                <div
                                  key={med.id}
                                  className="p-2.5 rounded-xl bg-slate-900 border border-blue-900/50 text-slate-300 space-y-1"
                                >
                                  <div className="flex items-center justify-between font-bold text-white">
                                    <span>{med.medicineName}</span>
                                    <span className="text-teal-400 text-[10px]">{med.dosage}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">{med.frequency} • {med.durationDays} days</p>
                                  <p className="text-[10px] text-teal-300/80 italic">{med.instructions}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
