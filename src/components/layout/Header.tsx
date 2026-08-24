'use client';

import React from 'react';
import { User, UserRole } from '@/types';
import {
  Stethoscope,
  User as UserIcon,
  Shield,
  Bell,
  HeartPulse,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRole,
  onRoleChange,
  onOpenNotifications,
}) => {
  const handleResetData = async () => {
    if (confirm('Reset demo state to initial seed appointments and physician leaves?')) {
      await fetch('/api/reset', { method: 'POST' });
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
                CarePulse AI
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                v1.0 Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Intelligent Clinical Consultation & Follow-up Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => onRoleChange('patient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeRole === 'patient'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Patient</span>
          </button>

          <button
            onClick={() => onRoleChange('doctor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeRole === 'doctor'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Doctor</span>
          </button>

          <button
            onClick={() => onRoleChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeRole === 'admin'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetData}
            title="Reset to Initial Seed Demo"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenNotifications}
            title="Open Email Sandbox & Logs"
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={currentUser.name}
              className="h-8 w-8 rounded-xl object-cover ring-2 ring-teal-500/20"
            />
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[110px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-teal-400 capitalize font-medium">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
