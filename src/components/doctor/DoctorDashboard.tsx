'use client';

import React, { useState } from 'react';
import { DoctorProfile, Appointment, User } from '@/types';
import { ConsultationModal } from './ConsultationModal';
import {
  Calendar,
  Clock,
  User as UserIcon,
  Activity,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface DoctorDashboardProps {
  doctorUser: User;
  doctors: DoctorProfile[];
  appointments: Appointment[];
  onRefreshData: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorUser,
  doctors,
  appointments,
  onRefreshData,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'all'>('today');

  const doctor =
    doctors.find((d) => d.userId === doctorUser.id || d.email === doctorUser.email) ||
    doctors[0];

  const todayStr = new Date().toISOString().split('T')[0];

  const doctorAppointments = appointments.filter((a) => a.doctorId === doctor?.id);

  const displayedAppointments = doctorAppointments.filter((a) => {
    if (selectedDateFilter === 'today') {
      return a.appointmentDate === todayStr;
    }
    return true;
  });

  const handleStartConsultation = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsConsultationOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={doctor?.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'}
            alt={doctor?.name}
            className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover ring-4 ring-teal-500/30 shadow-lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold">{doctor?.name}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {doctor?.specialisation}
              </span>
            </div>
            <p className="text-xs text-teal-100/80">
              {doctor?.roomNumber} • {doctor?.slotDurationMinutes} min consultations • Fee: ${doctor?.consultationFee}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[100px]">
            <span className="text-[10px] uppercase font-semibold text-teal-200 block">Today's Queue</span>
            <span className="text-xl font-black">{doctorAppointments.filter((a) => a.appointmentDate === todayStr).length}</span>
          </div>
          <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[100px]">
            <span className="text-[10px] uppercase font-semibold text-emerald-200 block">Completed</span>
            <span className="text-xl font-black">{doctorAppointments.filter((a) => a.status === 'COMPLETED').length}</span>
          </div>
          <button
            onClick={onRefreshData}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
            title="Refresh Schedule"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDateFilter('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedDateFilter === 'today'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Today's Patient Queue ({doctorAppointments.filter((a) => a.appointmentDate === todayStr).length})
          </button>
          <button
            onClick={() => setSelectedDateFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedDateFilter === 'all'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Scheduled ({doctorAppointments.length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {displayedAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-teal-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No pending patients in the queue
            </p>
            <p className="text-xs text-slate-400">
              All appointments for this period are completed or no new bookings have been placed.
            </p>
          </div>
        ) : (
          displayedAppointments.map((apt) => {
            const urgency = apt.preVisitSummary?.urgencyLevel || 'Low';
            const isCompleted = apt.status === 'COMPLETED';

            return (
              <div
                key={apt.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm">
                      {apt.patientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {apt.patientName}
                        </h3>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
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
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-teal-500" /> {apt.appointmentDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-500" /> {apt.startTime} - {apt.endTime}
                        </span>
                        <span>•</span>
                        <span>{apt.patientEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {!isCompleted ? (
                      <button
                        onClick={() => handleStartConsultation(apt)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition"
                      >
                        <Stethoscope className="h-4 w-4" />
                        <span>Examine & Prescribe</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Visit Completed
                      </span>
                    )}
                  </div>
                </div>

                {apt.preVisitSummary && (
                  <div className="p-4 rounded-2xl bg-teal-50/40 dark:bg-slate-800/60 border border-teal-100 dark:border-teal-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-teal-600" /> AI Pre-Visit Symptom Summary
                      </span>
                      {apt.preVisitSummary.vitalSigns?.bloodPressure && (
                        <span className="text-[11px] text-slate-500">
                          BP: {apt.preVisitSummary.vitalSigns.bloodPressure}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {apt.preVisitSummary.chiefComplaint}
                    </p>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        AI Suggested Clinical Inquiries:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {apt.preVisitSummary.suggestedQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 leading-snug"
                          >
                            <span className="text-teal-600 font-bold mr-1">Q{idx + 1}:</span>
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {isCompleted && apt.postVisitSummary && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <FileText className="h-3.5 w-3.5" /> Doctor Assessment: {apt.postVisitSummary.clinicalDiagnosis}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {apt.postVisitSummary.medicationSchedule.length} Prescriptions Scheduled
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic">
                      "{apt.postVisitSummary.patientFriendlyExplanation}"
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConsultationModal
        appointment={selectedAppointment}
        isOpen={isConsultationOpen}
        onClose={() => {
          setIsConsultationOpen(false);
          setSelectedAppointment(null);
        }}
        onConsultationCompleted={() => {
          onRefreshData();
        }}
      />
    </div>
  );
};
