'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Appointment, AppointmentPayload } from '@/lib/types';
import {
  Clock,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  booked: 'bg-blue-50 text-blue-700 ring-blue-600/10',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  completed: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  cancelled: 'bg-red-50 text-red-600 ring-red-500/10',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  rescheduled: 'bg-purple-50 text-purple-700 ring-purple-600/10',
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newBooking, setNewBooking] = useState<AppointmentPayload>({
    patient_id: 1,
    service_id: 1,
    start_at: '',
    end_at: '',
    status: 'booked',
    source_channel: 'dashboard',
    booked_by_ai: false,
    notes: '',
  });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setError(null);
      const data = await api.get<Appointment[]>('/appointments');
      setAppointments(data);
    } catch {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!newBooking.start_at || !newBooking.end_at) {
      setError('Please provide both start and end date/time');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.post<Appointment, AppointmentPayload>('/appointments/', newBooking);
      setShowForm(false);
      await load();
    } catch {
      setError('Failed to create appointment');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(appt: Appointment, status: AppointmentPayload['status']) {
    setSaving(true);
    setError(null);
    try {
      const payload: AppointmentPayload = {
        patient_id: appt.patient_id,
        service_id: appt.service_id,
        start_at: appt.start_at,
        end_at: appt.end_at,
        status,
        source_channel: appt.source_channel,
        booked_by_ai: appt.booked_by_ai,
        notes: appt.notes || '',
      };
      await api.put<Appointment, AppointmentPayload>(`/appointments/${appt.id}`, payload);
      await load();
    } catch {
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
          <p className="mt-1 text-sm text-slate-500">Manage and track patient bookings from all channels</p>
        </div>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="gradient-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="animate-scale-in rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Create Appointment</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input type="number" min={1} value={newBooking.patient_id} onChange={(e) => setNewBooking((p) => ({ ...p, patient_id: +e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Patient ID" />
            <input type="number" min={1} value={newBooking.service_id} onChange={(e) => setNewBooking((p) => ({ ...p, service_id: +e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Service ID" />
            <select value={newBooking.status} onChange={(e) => setNewBooking((p) => ({ ...p, status: e.target.value as AppointmentPayload['status'] }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="pending">Pending</option>
              <option value="booked">Booked</option>
              <option value="confirmed">Confirmed</option>
            </select>
            <input type="datetime-local" value={newBooking.start_at} onChange={(e) => setNewBooking((p) => ({ ...p, start_at: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <input type="datetime-local" value={newBooking.end_at} onChange={(e) => setNewBooking((p) => ({ ...p, end_at: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            <input type="text" value={newBooking.source_channel} onChange={(e) => setNewBooking((p) => ({ ...p, source_channel: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Channel" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => void create()} disabled={saving} className="gradient-primary rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Create'}</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            All Statuses
            <ChevronDown className="h-3 w-3" />
          </div>
          <span className="text-xs text-slate-400">{appointments.length} appointments</span>
        </div>

        <div className="overflow-x-auto">
          {loading && <div className="px-5 py-4 text-sm text-slate-400">Loading…</div>}
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Channel</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appointments.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400 italic">No appointments found.</td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="gradient-primary flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white">
                          {a.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{a.service_name}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-900">{new Date(a.start_at).toLocaleDateString()}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{new Date(a.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${STATUS_STYLES[a.status] || STATUS_STYLES.pending}`}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500 capitalize">{a.source_channel}</span>
                      {a.booked_by_ai && <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 ring-1 ring-inset ring-violet-500/10">AI</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => void updateStatus(a, 'confirmed')} disabled={saving || a.status === 'confirmed'} className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-30" title="Confirm"><CheckCircle2 className="h-4 w-4" /></button>
                        <button onClick={() => void updateStatus(a, 'completed')} disabled={saving || a.status === 'completed'} className="rounded-md p-1.5 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-30" title="Complete"><RotateCcw className="h-4 w-4" /></button>
                        <button onClick={() => void updateStatus(a, 'cancelled')} disabled={saving || a.status === 'cancelled'} className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-30" title="Cancel"><XCircle className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
