'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AvailabilityRule, AvailabilityRulePayload, BlockedDate, BlockedDatePayload } from '@/lib/types';
import { Clock, Calendar, Plus, Trash2, X } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [ruleForm, setRuleForm] = useState<AvailabilityRulePayload>({ weekday: 0, start_time: '09:00', end_time: '17:00' });
  const [blockForm, setBlockForm] = useState<BlockedDatePayload>({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setError(null);
      const [r, b] = await Promise.all([
        api.get<AvailabilityRule[]>('/availability/rules'),
        api.get<BlockedDate[]>('/availability/blocked'),
      ]);
      setRules(r);
      setBlocked(b);
    } catch { setError('Failed to load availability'); }
    finally { setLoading(false); }
  }

  async function addRule() {
    setSaving(true);
    setError(null);
    try {
      await api.post<AvailabilityRule, AvailabilityRulePayload>('/availability/rules', ruleForm);
      setShowRuleForm(false);
      await load();
    } catch { setError('Failed to add rule'); }
    finally { setSaving(false); }
  }

  async function deleteRule(id: number) {
    setSaving(true);
    try { await api.delete(`/availability/rules/${id}`); await load(); }
    catch { setError('Failed to delete'); }
    finally { setSaving(false); }
  }

  async function addBlock() {
    if (!blockForm.date) { setError('Date is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post<BlockedDate, BlockedDatePayload>('/availability/blocked', blockForm);
      setShowBlockForm(false);
      await load();
    } catch { setError('Failed to block date'); }
    finally { setSaving(false); }
  }

  async function deleteBlock(id: number) {
    setSaving(true);
    try { await api.delete(`/availability/blocked/${id}`); await load(); }
    catch { setError('Failed to delete'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Availability Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Configure your clinic&apos;s working hours and blocked dates</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-100">Loading…</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Working Hours */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-blue-600" /> Working Hours
            </h3>
            <button onClick={() => setShowRuleForm((p) => !p)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="h-3.5 w-3.5" /> Add Rule
            </button>
          </div>

          {showRuleForm && (
            <div className="animate-scale-in border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weekday</label>
                  <select value={ruleForm.weekday} onChange={(e) => setRuleForm((p) => ({ ...p, weekday: +e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Start</label>
                  <input type="time" value={ruleForm.start_time} onChange={(e) => setRuleForm((p) => ({ ...p, start_time: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">End</label>
                  <input type="time" value={ruleForm.end_time} onChange={(e) => setRuleForm((p) => ({ ...p, end_time: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <button onClick={() => void addRule()} disabled={saving} className="gradient-primary rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? '…' : 'Add'}</button>
                <button onClick={() => setShowRuleForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50 p-2">
            {rules.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400 italic">No rules configured.</p>
            ) : rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-sm font-semibold text-slate-900">{WEEKDAYS[r.weekday]}</span>
                  <span className="text-sm text-slate-500">{r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</span>
                </div>
                <button onClick={() => void deleteRule(r.id)} className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Calendar className="h-4 w-4 text-red-600" /> Blocked Dates
            </h3>
            <button onClick={() => setShowBlockForm((p) => !p)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
              <Plus className="h-3.5 w-3.5" /> Block Date
            </button>
          </div>

          {showBlockForm && (
            <div className="animate-scale-in border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</label>
                  <input type="date" value={blockForm.date} onChange={(e) => setBlockForm((p) => ({ ...p, date: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reason</label>
                  <input type="text" value={blockForm.reason || ''} onChange={(e) => setBlockForm((p) => ({ ...p, reason: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Optional" />
                </div>
                <button onClick={() => void addBlock()} disabled={saving} className="gradient-primary rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? '…' : 'Block'}</button>
                <button onClick={() => setShowBlockForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50 p-2">
            {blocked.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400 italic">No blocked dates.</p>
            ) : blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{new Date(b.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  <p className="text-xs text-slate-400">{b.reason || 'No reason'}</p>
                </div>
                <button onClick={() => void deleteBlock(b.id)} className="rounded-md p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
