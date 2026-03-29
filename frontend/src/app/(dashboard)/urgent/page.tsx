'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Conversation } from '@/lib/types';
import {
  AlertCircle,
  MessageSquare,
  User,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function UrgentCasesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Conversation[]>('/conversations/urgent')
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="gradient-danger flex h-10 w-10 items-center justify-center rounded-xl shadow-md">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Urgent Cases</h1>
          <p className="text-sm text-slate-500">High-priority inquiries requiring immediate attention</p>
        </div>
      </div>

      {loading && <div className="rounded-xl bg-white p-4 text-sm text-slate-400 ring-1 ring-slate-100">Loading…</div>}

      <div className="stagger space-y-4">
        {!loading && conversations.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-lg font-semibold text-slate-900">Clear Skies!</p>
            <p className="mt-1 text-sm text-slate-400">No urgent cases flagged at the moment.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="card-hover overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 border-l-4 border-l-red-500 p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <User className="h-4 w-4 text-slate-400" />
                        {conv.external_user_id}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Channel: {conv.source_channel}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-600 ring-1 ring-inset ring-red-500/10">
                      Urgent
                    </span>
                  </div>

                  <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <p className="text-xs font-semibold text-red-800">Issue Summary</p>
                    <p className="mt-1 text-sm text-red-700">
                      {conv.ai_summary || 'Patient mentioned severe symptoms requiring immediate follow-up.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(conv.updated_at || conv.created_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {conv.messages?.length || 0} messages</span>
                  </div>
                </div>

                <div className="flex items-center justify-center border-t border-slate-100 bg-slate-50/50 p-5 md:border-l md:border-t-0">
                  <button
                    onClick={() => (window.location.href = `/conversations?id=${conv.id}`)}
                    className="gradient-primary flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg"
                  >
                    Join Conversation
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
