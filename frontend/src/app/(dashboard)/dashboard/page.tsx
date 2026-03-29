'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AppointmentSummary, Appointment, Conversation, ConversationSummaryStats } from '@/lib/types';
import {
  Calendar,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<AppointmentSummary>({ total: 0, booked: 0, completed: 0, cancelled: 0, completion_rate_pct: 0, cancellation_rate_pct: 0 });
  const [convStats, setConvStats] = useState<ConversationSummaryStats>({ total_active: 0, total_urgent: 0, total_resolved: 0, total_follow_up: 0 });
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [recent, setRecent] = useState<Conversation[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, convData, upcomingData, recentData] = await Promise.all([
          api.get<AppointmentSummary>('/appointments/summary'),
          api.get<ConversationSummaryStats>('/conversations/summary'),
          api.get<Appointment[]>('/appointments/upcoming?limit=5'),
          api.get<Conversation[]>('/conversations/recent?limit=5'),
        ]);
        setSummary(statsData);
        setConvStats(convData);
        setUpcoming(upcomingData);
        setRecent(recentData);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const stats = [
    {
      name: 'Total Bookings',
      value: summary.total,
      icon: Calendar,
      gradient: 'gradient-primary',
      change: `${summary.completion_rate_pct}% completed`,
    },
    {
      name: 'Active Bookings',
      value: summary.booked,
      icon: TrendingUp,
      gradient: 'gradient-success',
      change: 'Confirmed & booked',
    },
    {
      name: 'Urgent Cases',
      value: convStats.total_urgent,
      icon: AlertCircle,
      gradient: 'gradient-danger',
      change: convStats.total_urgent > 0 ? 'Needs attention' : 'All clear',
    },
    {
      name: 'Active Chats',
      value: convStats.total_active,
      icon: MessageSquare,
      gradient: 'gradient-purple',
      change: `${convStats.total_follow_up} follow-ups`,
    },
  ];

  const channelIcon = (ch: string) => {
    switch (ch) {
      case 'instagram': return '📸';
      case 'facebook': return '💬';
      case 'whatsapp': return '📱';
      default: return '🌐';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back — here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Link
          href="/simulator"
          className="gradient-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30"
        >
          <Zap className="h-4 w-4" />
          Test AI Agent
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="card-hover group relative overflow-hidden rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.change}</p>
              </div>
              <div className={`${stat.gradient} flex h-10 w-10 items-center justify-center rounded-lg shadow-md`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
            {/* Decorative corner gradient */}
            <div className={`${stat.gradient} pointer-events-none absolute -right-6 -bottom-6 h-20 w-20 rounded-full opacity-[0.06] transition-opacity group-hover:opacity-[0.12]`} />
          </div>
        ))}
      </div>

      {/* Bottom rows */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Upcoming Appointments
            </h3>
            <Link
              href="/appointments"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {upcoming.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400 italic">
                No upcoming appointments scheduled.
              </p>
            ) : (
              upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white">
                      {a.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.patient_name}</p>
                      <p className="text-xs text-slate-400">{a.service_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-700">
                      {new Date(a.start_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(a.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Recent Inquiries
            </h3>
            <Link
              href="/conversations"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400 italic">
                No recent social media inquiries.
              </p>
            ) : (
              recent.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{channelIcon(c.source_channel)}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{c.external_user_id}</p>
                      <p className="text-xs text-slate-400 capitalize">{c.source_channel} · {c.detected_intent || 'general'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.urgency_flag && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                        Urgent
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {new Date(c.updated_at || c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
