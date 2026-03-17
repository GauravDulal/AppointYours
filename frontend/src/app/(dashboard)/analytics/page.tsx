'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Calendar, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';

type AppointmentSummary = {
  total: number;
  booked: number;
  completed: number;
  cancelled: number;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AppointmentSummary>({
    total: 0,
    booked: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await api.get<AppointmentSummary>('/appointments/summary');
        setSummary(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, []);

  const completionRate = useMemo(() => {
    if (summary.total === 0) return 0;
    return Math.round((summary.completed / summary.total) * 100);
  }, [summary.completed, summary.total]);

  const cancellationRate = useMemo(() => {
    if (summary.total === 0) return 0;
    return Math.round((summary.cancelled / summary.total) * 100);
  }, [summary.cancelled, summary.total]);

  const cards = [
    {
      title: 'Total Appointments',
      value: summary.total,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Booked',
      value: summary.booked,
      icon: Calendar,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      title: 'Completed',
      value: summary.completed,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Cancelled',
      value: summary.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500">Booking performance snapshot</p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-10 text-center text-sm text-gray-500">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div key={card.title} className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className={`${card.bg} rounded-full p-3`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="mt-1 text-xs text-gray-500">Completed / Total appointments</p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Cancellation Rate</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{cancellationRate}%</p>
              <p className="mt-1 text-xs text-gray-500">Cancelled / Total appointments</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
