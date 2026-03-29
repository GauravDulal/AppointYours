'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Service, ServicePayload } from '@/lib/types';
import {
  Stethoscope,
  Clock,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';

const emptyPayload: ServicePayload = { name: '', description: '', duration_minutes: 30, price: 0, is_active: true };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ServicePayload>(emptyPayload);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setError(null);
      const data = await api.get<Service[]>('/services');
      setServices(data);
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditId(null);
    setForm(emptyPayload);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditId(s.id);
    setForm({ name: s.name, description: s.description || '', duration_minutes: s.duration_minutes, price: s.price ?? 0, is_active: s.is_active });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Service name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await api.put<Service, ServicePayload>(`/services/${editId}`, form);
      } else {
        await api.post<Service, ServicePayload>('/services/', form);
      }
      setShowForm(false);
      await load();
    } catch { setError('Failed to save service'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this service?')) return;
    setSaving(true);
    try {
      await api.delete(`/services/${id}`);
      await load();
    } catch { setError('Failed to delete'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dental Services</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the services offered by your clinic</p>
        </div>
        <button onClick={openCreate} className="gradient-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className="animate-scale-in rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{editId ? 'Edit Service' : 'New Service'}</h2>
            <button onClick={() => setShowForm(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Service name" />
            <input value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Description" />
            <input type="number" min={5} value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: +e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Duration (mins)" />
            <input type="number" min={0} step={0.01} value={form.price || ''} onChange={(e) => setForm((p) => ({ ...p, price: +e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Price ($)" />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={() => void handleSave()} disabled={saving} className="gradient-primary rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="stagger grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading && <div className="md:col-span-2 lg:col-span-3 rounded-xl bg-white p-5 text-sm text-slate-400 ring-1 ring-slate-100">Loading services…</div>}
        {services.map((s) => (
          <div key={s.id} className="card-hover group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between">
              <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-lg shadow-md">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => void handleDelete(s.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{s.description || 'No description provided.'}</p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <div className="flex items-center gap-1 text-slate-600"><Clock className="h-4 w-4 text-slate-400" />{s.duration_minutes} min</div>
              <div className="flex items-center gap-0.5 font-semibold text-slate-900"><DollarSign className="h-4 w-4 text-slate-400" />{s.price ?? '—'}</div>
            </div>
            <div className="mt-3">
              {s.is_active ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3 w-3" />Active</span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-red-500"><XCircle className="h-3 w-3" />Inactive</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
