'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

type ConversationMessage = {
  id: number;
  sender_type: 'patient' | 'assistant' | 'staff' | 'system';
  content: string;
  timestamp: string;
};

type Conversation = {
  id: number;
  source_channel: string;
  external_user_id: string;
  status: string;
  urgency_flag: boolean;
  ai_summary?: string;
  created_at: string;
  updated_at?: string;
  messages: ConversationMessage[];
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await api.get<Conversation[]>('/conversations');
        setConversations(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      async function loadMessages() {
        try {
          const data = await api.get<Conversation>(`/conversations/${selectedId}`);
          setMessages(data.messages);
        } catch (err) {
          console.error(err);
        }
      }
      loadMessages();
    }
  }, [selectedId]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string, urgent: boolean) => {
    if (urgent) return <span className="flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-600 ml-2"><AlertCircle className="h-3 w-3 mr-1" /> Urgent</span>;
    if (status === 'resolved') return <span className="flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-600 ml-2"><CheckCircle2 className="h-3 w-3 mr-1" /> Resolved</span>;
    return <span className="flex items-center text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 ml-2"><Clock className="h-3 w-3 mr-1" /> Active</span>;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Unified Inbox</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button className="flex items-center px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 pb-4">
        {/* Conversation List */}
        <div className="col-span-4 bg-white rounded-lg border shadow-sm flex flex-col min-h-0">
          <div className="p-4 border-b font-medium">Messages</div>
          {loading && <div className="px-4 py-2 text-sm text-gray-500 border-b">Loading conversations...</div>}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 flex items-start space-x-3 transition-colors ${
                  selectedId === c.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="bg-gray-100 rounded-full p-2 mt-1">
                  {getChannelIcon(c.source_channel)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-900 truncate">{c.external_user_id}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {c.ai_summary || 'No summary available'}
                    </p>
                    {getStatusBadge(c.status, c.urgency_flag)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="col-span-8 bg-white rounded-lg border shadow-sm flex flex-col min-h-0">
          {selectedId ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Conversation with {conversations.find(c => c.id === selectedId)?.external_user_id}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs border rounded hover:bg-gray-50">Mark as Resolved</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] space-y-1`}>
                      <span className="text-[10px] text-gray-500 px-1 uppercase font-bold">
                        {m.sender_type}
                      </span>
                      <div
                        className={`p-3 rounded-lg text-sm shadow-sm ${
                          m.sender_type === 'patient'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 border rounded-bl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-gray-400 block px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Type a manual reply..." 
                    className="flex-1 border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
