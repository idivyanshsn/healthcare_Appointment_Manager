'use client';

import React, { useState } from 'react';
import { DoctorProfile } from '@/types';
import {
  Search,
  Star,
  Clock,
  MapPin,
  Calendar,
  Stethoscope,
  Sparkles,
  ChevronRight,
  Filter,
  DollarSign,
} from 'lucide-react';

interface DoctorSearchProps {
  doctors: DoctorProfile[];
  onSelectDoctor: (doctor: DoctorProfile) => void;
}

const SPECIALISATIONS = [
  'ALL',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
];

export const DoctorSearch: React.FC<DoctorSearchProps> = ({ doctors, onSelectDoctor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialisation, setSelectedSpecialisation] = useState('ALL');

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.bio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialisation =
      selectedSpecialisation === 'ALL' ||
      doc.specialisation.toLowerCase() === selectedSpecialisation.toLowerCase();

    return matchesSearch && matchesSpecialisation;
  });

  return (
    <div className="space-y-6">
      <div className="relative rounded-3xl bg-gradient-to-r from-teal-900/60 via-slate-900 to-slate-900 border border-teal-500/20 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Assisted Physician Matching & Triage</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Schedule an Expert Clinical Consultation
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Select a specialist, lock your slot with a 10-minute hold guard, and submit your symptoms for instant AI urgency triage and physician prep.
          </p>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by specialist name, condition (e.g. chest pain, skin rash), or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {SPECIALISATIONS.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialisation(spec)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSpecialisation === spec
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 space-y-2">
            <Stethoscope className="h-10 w-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No physicians found matching your search.</p>
            <p className="text-xs">Try selecting a different specialty or clearing search terms.</p>
          </div>
        ) : (
          filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="group rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-teal-500/40 p-5 shadow-lg hover:shadow-2xl transition duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-teal-500/20 shadow-md group-hover:scale-105 transition"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {doc.specialisation}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 truncate mt-1">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400" />
                        {doc.rating.toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{doc.experienceYears} yrs exp</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    <Clock className="h-3.5 w-3.5 text-teal-400" />
                    <span>{doc.slotDurationMinutes} min consult</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    <DollarSign className="h-3.5 w-3.5 text-teal-400" />
                    <span>${doc.consultationFee} fee</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  {doc.roomNumber}
                </span>

                <button
                  onClick={() => onSelectDoctor(doc)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 group-hover:shadow-teal-500/30 transition transform active:scale-95"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Book Visit</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
