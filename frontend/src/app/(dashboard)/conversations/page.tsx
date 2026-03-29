'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Conversation, ChatMessage } from '@/lib/types';
import {
  Instagram,
  Facebook,
  MessageCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
} from 'lucide-react';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Conversation[]>('/conversations');
        setConversations(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch { setError('Failed to load conversations'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get<Conversation>(`/conversations/${selectedId}`)
      .then((d) => setMessages(d.messages))
      .catch(() => setError('Failed to load messages'));
  }, [selectedId]);

  async function refresh() {
    const data = await api.get<Conversation[]>('/conversations');
    setConversations(data);
  }

  async function refreshMessages(id: number) {
    const data = await api.get<Conversation>(`/conversations/${id}`);
    setMessages(data.messages);
  }

  async function updateStatus(status: 'active' | 'follow_up' | 'resolved') {
    if (!selectedId) return;
    setUpdatingStatus(true);
    try {
      await api.patch<Conversation, { status: string }>(`/conversations/${selectedId}/status?status=${status}`, { status });
      await refresh();
    } catch { setError('Failed to update status'); }
    finally { setUpdatingStatus(false); }
  }

  async function sendReply() {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selectedId}/messages`, {
        sender_type: 'staff',
        content: replyText.trim(),
        conversation_id: selectedId,
      });
      setReplyText('');
      await refreshMessages(selectedId);
      await refresh();
    } catch { setError('Failed to send reply'); }
    finally { setSending(false); }
  }

  const channelIcon = (ch: string) => {
    switch (ch) {
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const statusBadge = (status: string, urgent: boolean) => {
    if (urgent) return <span className="flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600 ring-1 ring-inset ring-red-500/10"><AlertCircle className="mr-1 h-3 w-3" />Urgent</span>;
    if (status === 'resolved') return <span className="flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 ring-1 ring-inset ring-emerald-500/10"><CheckCircle2 className="mr-1 h-3 w-3" />Resolved</span>;
    return <span className="flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600 ring-1 ring-inset ring-blue-500/10"><Clock className="mr-1 h-3 w-3" />Active</span>;
  };

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unified Inbox</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search…" className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="h-4 w-4 text-slate-400" /> Filter
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        {/* List */}
        <div className="col-span-4 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Messages ({conversations.length})
          </div>
          {loading && <div className="px-5 py-3 text-sm text-slate-400">Loading…</div>}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setSelectedId(c.id)} className={`flex w-full items-start gap-3 border-b border-slate-50 p-4 text-left transition-colors ${selectedId === c.id ? 'bg-blue-50/60 border-l-2 border-l-blue-600' : 'hover:bg-slate-50/50'}`}>
                <div className="mt-0.5 rounded-full bg-slate-100 p-2">{channelIcon(c.source_channel)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-slate-900">{c.external_user_id}</span>
                    <span className="ml-2 text-[10px] text-slate-400">{new Date(c.updated_at || c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="flex-1 truncate text-xs text-slate-400">{c.ai_summary || 'No summary'}</p>
                    {statusBadge(c.status, c.urgency_flag)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="col-span-8 flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          {selectedId ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <span className="text-sm font-semibold text-slate-900">
                  {conversations.find((c) => c.id === selectedId)?.external_user_id}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => void updateStatus('follow_up')} disabled={updatingStatus} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">Follow Up</button>
                  <button onClick={() => void updateStatus('resolved')} disabled={updatingStatus} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50">Resolve</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/30 p-5 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%] space-y-1">
                      <span className="block px-1 text-[10px] font-bold uppercase text-slate-400">{m.sender_type}</span>
                      <div className={`rounded-xl px-4 py-2.5 text-sm shadow-sm ${m.sender_type === 'patient' ? 'gradient-primary text-white rounded-br-sm' : 'bg-white text-slate-900 ring-1 ring-slate-100 rounded-bl-sm'}`}>
                        {m.content}
                      </div>
                      <span className="block px-1 text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <input
                  type="text"
                  placeholder="Type a reply…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void sendReply(); } }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={() => void sendReply()} disabled={sending || !replyText.trim()} className="gradient-primary rounded-lg p-2.5 text-white shadow-md disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}
