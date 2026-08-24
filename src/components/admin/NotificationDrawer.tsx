'use client';

import React, { useState, useEffect } from 'react';
import { NotificationLog } from '@/types';
import {
  X,
  Bell,
  Mail,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<'ALL' | 'patient' | 'doctor'>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', logId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLogs();
      }
    } catch (err) {
      console.error('Retry failed', err);
    } finally {
      setRetryingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filterRole === 'ALL') return true;
    return l.recipientRole === filterRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-300">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Email Sandbox & Notification Outbox
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live inspection of all transactional emails & retry queue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Filter:</span>
          {(['ALL', 'patient', 'doctor'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1 rounded-lg font-semibold capitalize transition ${
                filterRole === r
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No notification logs found.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isSent = log.status === 'SENT' || log.status === 'RETRIED';
              const isFailed = log.status === 'FAILED';

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                    isFailed
                      ? 'border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                      {log.subject}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                        isSent
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse'
                      }`}
                    >
                      {isSent ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {log.status}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                    {log.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <span>To: <strong>{log.recipientName}</strong> ({log.recipientEmail})</span>
                      <span>•</span>
                      <span className="capitalize">{log.recipientRole}</span>
                    </div>

                    {isFailed && (
                      <button
                        disabled={retryingId === log.id}
                        onClick={() => handleRetry(log.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition shadow-xs"
                      >
                        <RotateCw className={`h-3 w-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
