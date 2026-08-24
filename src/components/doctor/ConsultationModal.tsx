'use client';

import React, { useState } from 'react';
import { Appointment, PostVisitSummary } from '@/types';
import {
  X,
  Stethoscope,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Pill,
} from 'lucide-react';

interface ConsultationModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onConsultationCompleted: () => void;
}

interface PrescriptionRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onConsultationCompleted,
}) => {
  const [doctorNotes, setDoctorNotes] = useState(
    'Dx: Essential Hypertension / Tension Migraine. Patient exhibits steady improvement. Rx: prescribed anti-hypertensive regimen and lifestyle modifications.'
  );
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([
    {
      name: 'Amlodipine 5mg',
      dosage: '1 tablet',
      frequency: 'Once daily morning',
      duration: '14',
      instructions: 'Take in the morning with or without food. Monitor blood pressure weekly.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<PostVisitSummary | null>(null);

  if (!isOpen || !appointment) return null;

  const handleAddPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        name: '',
        dosage: '1 tablet',
        frequency: 'Twice daily with food',
        duration: '7',
        instructions: 'Take with a full glass of water.',
      },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePrescription = (
    index: number,
    field: keyof PrescriptionRow,
    value: string
  ) => {
    setPrescriptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCompleteConsultation = async () => {
    if (!doctorNotes.trim()) {
      setError('Clinical notes are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMPLETE_CONSULTATION',
          doctorNotes,
          prescriptions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedSummary(data.postVisitSummary);
        setTimeout(() => {
          onConsultationCompleted();
          onClose();
        }, 1800);
      } else {
        setError(data.error || 'Failed to finalize consultation');
      }
    } catch (err: any) {
      setError(err.message || 'Network error completing consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-300">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Complete Consultation: {appointment.patientName}
              </h2>
              <p className="text-xs text-slate-500">
                {appointment.appointmentDate} at {appointment.startTime} • {appointment.consultationType}
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
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {appointment.preVisitSummary && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-500" /> Patient Pre-Visit Chief Complaint
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  appointment.preVisitSummary.urgencyLevel === 'High'
                    ? 'urgency-badge-high'
                    : appointment.preVisitSummary.urgencyLevel === 'Medium'
                    ? 'urgency-badge-medium'
                    : 'urgency-badge-low'
                }`}
              >
                {appointment.preVisitSummary.urgencyLevel} Urgency
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 italic">
              "{appointment.preVisitSummary.chiefComplaint}"
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            Clinical Notes & Diagnosis (LLM will summarize for patient)
          </label>
          <textarea
            rows={4}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            placeholder="Enter clinical examination notes, formal diagnosis, treatment rationales..."
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5 text-teal-500" /> Prescribe Medications
            </label>
            <button
              type="button"
              onClick={handleAddPrescription}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Medicine</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {prescriptions.map((rx, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Amoxicillin 500mg)"
                    value={rx.name}
                    onChange={(e) => handleUpdatePrescription(idx, 'name', e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 1 cap)"
                    value={rx.dosage}
                    onChange={(e) => handleUpdatePrescription(idx, 'dosage', e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={rx.frequency}
                      onChange={(e) => handleUpdatePrescription(idx, 'frequency', e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    >
                      <option>Once daily morning</option>
                      <option>Once daily at night</option>
                      <option>Twice daily with food</option>
                      <option>Thrice daily with food</option>
                      <option>Every 6 hours as needed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Special instructions (e.g. take with meals, complete 7 days)"
                  value={rx.instructions}
                  onChange={(e) => handleUpdatePrescription(idx, 'instructions', e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>

        {generatedSummary && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5 animate-slide-up">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>AI Post-Visit Summary & Medication Reminders Scheduled!</span>
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
              Patient friendly translation and daily dose reminders have been dispatched. Closing...
            </p>
          </div>
        )}

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
            disabled={isSubmitting || !!generatedSummary}
            onClick={handleCompleteConsultation}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Generating Patient Summary with LLM...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete Visit & Generate Patient Summary</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
