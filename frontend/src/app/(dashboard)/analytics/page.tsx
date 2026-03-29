'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { AppointmentSummary } from '@/lib/types';
import { Calendar, CheckCircle2, XCircle, ClipboardList, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AppointmentSummary>({ total: 0, booked: 0, completed: 0, cancelled: 0, completion_rate_pct: 0, cancellation_rate_pct: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AppointmentSummary>('/appointments/summary')
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completionRate = useMemo(() => summary.completion_rate_pct, [summary]);
  const cancellationRate = useMemo(() => summary.cancellation_rate_pct, [summary]);

  const cards = [
    { title: 'Total Appointments', value: summary.total, icon: ClipboardList, gradient: 'gradient-primary' },
    { title: 'Booked', value: summary.booked, icon: Calendar, gradient: 'gradient-purple' },
    { title: 'Completed', value: summary.completed, icon: CheckCircle2, gradient: 'gradient-success' },
    { title: 'Cancelled', value: summary.cancelled, icon: XCircle, gradient: 'gradient-danger' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Booking performance snapshot</p>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-400 ring-1 ring-slate-100">Loading analytics…</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => (
              <div key={c.title} className="card-hover relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{c.title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{c.value}</p>
                  </div>
                  <div className={`${c.gradient} flex h-10 w-10 items-center justify-center rounded-lg shadow-md`}>
                    <c.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className={`${c.gradient} pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-[0.06]`} />
              </div>
            ))}
          </div>

          {/* Rate Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Completion */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completion Rate</p>
                  <p className="mt-2 text-4xl font-bold text-emerald-600">{completionRate}%</p>
                  <p className="mt-1 text-xs text-slate-400">of all appointments completed</p>
                </div>
                <div className="gradient-success flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${completionRate}%` }} />
              </div>
            </div>

            {/* Cancellation */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Cancellation Rate</p>
                  <p className="mt-2 text-4xl font-bold text-red-500">{cancellationRate}%</p>
                  <p className="mt-1 text-xs text-slate-400">of all appointments cancelled</p>
                </div>
                <div className="gradient-danger flex h-12 w-12 items-center justify-center rounded-xl shadow-md">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100">
                <div className="h-2.5 rounded-full bg-red-500 transition-all duration-700" style={{ width: `${cancellationRate}%` }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
