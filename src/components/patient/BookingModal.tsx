'use client';

import React, { useState, useEffect } from 'react';
import { DoctorProfile, TimeSlot, SlotHold, User, PreVisitSummary } from '@/types';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorProfile | null;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  currentUser,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [doctorOnLeave, setDoctorOnLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [consultationType, setConsultationType] = useState<'IN_PERSON' | 'TELE_CONSULT'>('IN_PERSON');

  const [activeHold, setActiveHold] = useState<SlotHold | null>(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState<number>(0);
  const [holdingSlot, setHoldingSlot] = useState(false);

  const [symptoms, setSymptoms] = useState('');
  const [preVisitSummary, setPreVisitSummary] = useState<PreVisitSummary | null>(null);
  const [isGeneratingTriage, setIsGeneratingTriage] = useState(false);

  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && doctor) {
      setStep(1);
      setSelectedSlot(null);
      setActiveHold(null);
      setErrorMessage(null);
      setSymptoms('');
      setPreVisitSummary(null);
      fetchSlots(selectedDate);
    }
  }, [isOpen, doctor, selectedDate]);

  useEffect(() => {
    if (!activeHold?.expiresAt) {
      setHoldRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = activeHold.expiresAt - Date.now();
      if (remainingMs <= 0) {
        setHoldRemainingSeconds(0);
        setActiveHold(null);
        setSelectedSlot(null);
        setErrorMessage('Your 10-minute slot hold has expired. Please select a time slot again.');
        fetchSlots(selectedDate);
      } else {
        setHoldRemainingSeconds(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeHold, selectedDate]);

  const fetchSlots = async (dateStr: string) => {
    if (!doctor) return;
    setLoadingSlots(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/doctors/${doctor.id}/slots?date=${dateStr}&patientId=${currentUser.id}`
      );
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
        setDoctorOnLeave(data.doctorOnLeave || false);
        setLeaveReason(data.leaveReason || '');
      } else {
        setErrorMessage(data.error || 'Failed to fetch slots');
      }
    } catch (err) {
      setErrorMessage('Network error fetching slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectSlot = async (slot: TimeSlot) => {
    if (!doctor || !slot.isAvailable) return;
    setHoldingSlot(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/slots/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientId: currentUser.id,
          appointmentDate: selectedDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveHold(data.hold);
        setSelectedSlot(slot);
        fetchSlots(selectedDate);
      } else {
        setErrorMessage(data.error || 'Could not hold slot. It may have just been claimed.');
        fetchSlots(selectedDate);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error acquiring slot hold');
    } finally {
      setHoldingSlot(false);
    }
  };

  const handleGenerateTriage = async () => {
    if (!symptoms.trim()) {
      setErrorMessage('Please describe your symptoms before proceeding.');
      return;
    }

    setIsGeneratingTriage(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/pre-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      if (data.success) {
        setPreVisitSummary(data.summary);
        setStep(3);
      } else {
        setErrorMessage(data.error || 'Failed to generate AI pre-visit summary');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating AI triage');
    } finally {
      setIsGeneratingTriage(false);
    }
  };

  const handleFinalizeBooking = async () => {
    if (!doctor || !selectedSlot) return;
    setIsSubmittingBooking(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientId: currentUser.id,
          patientName: currentUser.name,
          patientEmail: currentUser.email,
          patientPhone: currentUser.phone,
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          consultationType,
          preVisitSummary,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onBookingSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || 'Booking conflict encountered.');
        if (res.status === 409) {
          setStep(1);
          fetchSlots(selectedDate);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error confirming booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img
              src={doctor.avatarUrl}
              alt={doctor.name}
              className="h-12 w-12 rounded-2xl object-cover ring-2 ring-teal-500/20"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Book Consultation: {doctor.name}
              </h2>
              <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                {doctor.specialisation} • ${doctor.consultationFee} • {doctor.roomNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeHold && holdRemainingSeconds > 0 && (
          <div className="px-6 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>Slot <strong>{selectedSlot?.startTime} - {selectedSlot?.endTime}</strong> locked for you</span>
            </div>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              Hold expires in {formatTimer(holdRemainingSeconds)}
            </span>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
              <span className="h-6 w-6 rounded-full border flex items-center justify-center">1</span>
              <span>Select Slot</span>
            </div>
            <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-slate-800" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
              <span className="h-6 w-6 rounded-full border flex items-center justify-center">2</span>
              <span>AI Symptom Intake</span>
            </div>
            <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-slate-800" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
              <span className="h-6 w-6 rounded-full border flex items-center justify-center">3</span>
              <span>Confirm & Sync</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                    Consultation Type
                  </label>
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="IN_PERSON">In-Person Consultation ({doctor.roomNumber})</option>
                    <option value="TELE_CONSULT">Tele-Health HD Video Consultation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Available Consultation Slots ({doctor.slotDurationMinutes} mins each)
                </label>

                {loadingSlots ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Clock className="h-6 w-6 animate-spin mx-auto text-teal-500" />
                    <p>Checking live physician availability & slot hold locks...</p>
                  </div>
                ) : doctorOnLeave ? (
                  <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Physician on Scheduled Leave
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {leaveReason || 'Doctor is unavailable on this date'}. Please select another date.
                    </p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No available consultation slots on this date. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      const isMine = slot.status === 'HELD_BY_YOU';
                      const isHeldOther = slot.status === 'HELD_BY_OTHER';
                      const isBooked = slot.status === 'BOOKED';

                      let btnStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-500';
                      if (isSelected || isMine) {
                        btnStyle = 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold ring-2 ring-teal-500/30';
                      } else if (isHeldOther) {
                        btnStyle = 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 text-amber-500 cursor-not-allowed opacity-75';
                      } else if (isBooked) {
                        btnStyle = 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed line-through';
                      }

                      return (
                        <button
                          key={slot.startTime}
                          disabled={!slot.isAvailable || holdingSlot}
                          onClick={() => handleSelectSlot(slot)}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center transition active:scale-95 ${btnStyle}`}
                        >
                          <span className="font-semibold">{slot.startTime}</span>
                          <span className="text-[10px] opacity-75">
                            {isBooked ? 'Booked' : isHeldOther ? 'Held (10m)' : isMine ? 'Your Lock' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  disabled={!selectedSlot || !activeHold}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 active:scale-95"
                >
                  <span>Continue to Symptom Triage</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-100 dark:border-teal-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  Our AI model analyzes your symptoms according to standard clinical protocols to estimate visit urgency (Low/Medium/High) and formulate suggested questions for {doctor.name}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Describe Your Symptoms & Duration
                </label>
                <textarea
                  rows={4}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild shortness of breath and chest pressure for 3 days after climbing stairs, no nausea or jaw pain..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Slots</span>
                </button>

                <button
                  disabled={isGeneratingTriage || !symptoms.trim()}
                  onClick={handleGenerateTriage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 active:scale-95"
                >
                  {isGeneratingTriage ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>Analyzing Symptoms with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Analyze & Preview Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && preVisitSummary && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    AI Clinical Triage Assessment
                  </span>
                  <span
                    className={`font-extrabold text-xs px-2.5 py-0.5 rounded-full ${
                      preVisitSummary.urgencyLevel === 'High'
                        ? 'urgency-badge-high'
                        : preVisitSummary.urgencyLevel === 'Medium'
                        ? 'urgency-badge-medium'
                        : 'urgency-badge-low'
                    }`}
                  >
                    {preVisitSummary.urgencyLevel} Urgency
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Chief Complaint:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {preVisitSummary.chiefComplaint}
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                    AI Suggested Questions for Dr. {doctor.name.split(' ')[1] || doctor.name}:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {preVisitSummary.suggestedQuestions.map((q, idx) => (
                      <li key={idx} className="leading-snug">{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/40 dark:bg-slate-800/40 border border-teal-100 dark:border-teal-900/40 text-slate-700 dark:text-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Appointment Schedule:</span>
                  <span>{selectedDate} at {selectedSlot?.startTime} ({consultationType})</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Physician:</span>
                  <span>{doctor.name} ({doctor.specialisation})</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Consultation Fee:</span>
                  <span>${doctor.consultationFee}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Edit Symptoms</span>
                </button>

                <button
                  disabled={isSubmittingBooking}
                  onClick={handleFinalizeBooking}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-teal-600/30 active:scale-95"
                >
                  {isSubmittingBooking ? (
                    <span>Confirming Slot & Dispatching Alerts...</span>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4" />
                      <span>Confirm & Book Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
