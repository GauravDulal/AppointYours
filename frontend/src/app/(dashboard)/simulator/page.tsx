'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { ChatMessage, Conversation } from '@/lib/types';
import { Send, Instagram, Facebook, MessageCircle, Trash2 } from 'lucide-react';

interface SimChatMessage {
  sender_type: 'patient' | 'assistant' | 'staff' | 'system';
  content: string;
  timestamp?: string;
}

export default function SimulatorPage() {
  const [channel, setChannel] = useState('instagram');
  const [userId, setUserId] = useState('simulated_user_123');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<SimChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(false);

  const channels = [
    { id: 'instagram', name: 'Instagram DM', icon: Instagram, color: 'text-pink-500', ring: 'ring-pink-200 bg-pink-50' },
    { id: 'facebook', name: 'FB Messenger', icon: Facebook, color: 'text-blue-600', ring: 'ring-blue-200 bg-blue-50' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', ring: 'ring-green-200 bg-green-50' },
  ];
  const sel = channels.find((c) => c.id === channel) ?? channels[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    const userMsg: SimChatMessage = { sender_type: 'patient', content, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    const sent = content;
    setContent('');
    setTyping(true);

    try {
      await api.post('/simulator/inbound', { channel, external_user_id: userId, content: sent });

      // Wait for AI to process, then fetch updated messages
      await new Promise((r) => setTimeout(r, 1200));
      const convos = await api.get<Conversation[]>('/conversations');
      const current = convos.find((c) => c.source_channel === channel && c.external_user_id === userId);
      if (current) {
        const detail = await api.get<Conversation>(`/conversations/${current.id}`);
        setMessages(detail.messages.map((m: ChatMessage) => ({ sender_type: m.sender_type, content: m.content, timestamp: m.timestamp })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send.');
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Social Media Simulator</h1>
        <p className="mt-1 text-sm text-slate-500">Test the AI booking flow by simulating inbound messages</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Controls */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</h3>
            <div className="space-y-2">
              {channels.map((c) => (
                <button key={c.id} onClick={() => setChannel(c.id)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${channel === c.id ? `ring-2 ${c.ring}` : 'hover:bg-slate-50'}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} /> {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">User ID</h3>
            <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button onClick={() => setMessages([])} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50">
            <Trash2 className="h-3.5 w-3.5" /> Clear Chat
          </button>
        </div>

        {/* Chat */}
        <div className="flex h-[600px] flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <sel.icon className={`h-4 w-4 ${sel.color}`} />
              <span className="text-sm font-semibold text-slate-900">Chat with AI Agent</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 && (
              <p className="mt-20 text-center text-sm text-slate-400 italic">Send a message to start.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] space-y-1`}>
                  <span className="block px-1 text-[10px] font-bold uppercase text-slate-400">{m.sender_type}</span>
                  <div className={`rounded-xl px-4 py-2.5 text-sm shadow-sm ${m.sender_type === 'patient' ? 'gradient-primary text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                  {m.timestamp && (
                    <span className="block px-1 text-[10px] text-slate-400">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
            <input type="text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your message…" disabled={loading} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50" />
            <button type="submit" disabled={loading || !content.trim()} className="gradient-primary rounded-lg p-2.5 text-white shadow-md disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
