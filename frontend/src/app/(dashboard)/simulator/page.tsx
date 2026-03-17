'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Send, Instagram, Facebook, MessageCircle } from 'lucide-react';

type ChatMessage = {
  sender_type: 'patient' | 'assistant' | 'staff' | 'system';
  content: string;
  timestamp?: string;
};

type ConversationSummary = {
  id: number;
  source_channel: string;
  external_user_id: string;
};

type ConversationDetail = {
  messages: ChatMessage[];
};

export default function SimulatorPage() {
  const [channel, setChannel] = useState('instagram');
  const [externalUserId, setExternalUserId] = useState('simulated_user_123');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channels = [
    { id: 'instagram', name: 'Instagram DM', icon: Instagram, color: 'text-pink-600' },
    { id: 'facebook', name: 'FB Messenger', icon: Facebook, color: 'text-blue-600' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
  ];

  const selectedChannel = channels.find((item) => item.id === channel) ?? channels[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);
    const userMsg: ChatMessage = { sender_type: 'patient', content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    
    try {
      await api.post('/simulator/inbound', {
        channel,
        external_user_id: externalUserId,
        content
      });
      setContent('');
      
      // Fetch latest messages for this conversation after a short delay for AI to process
      setTimeout(async () => {
        try {
          const conversations = await api.get<ConversationSummary[]>('/conversations');
          const currentConv = conversations.find((c) => 
            c.source_channel === channel && c.external_user_id === externalUserId
          );
          if (currentConv) {
            const detailedConv = await api.get<ConversationDetail>(`/conversations/${currentConv.id}`);
            setMessages(detailedConv.messages);
          }
        } catch (fetchError) {
          console.error(fetchError);
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load updated conversation.');
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to send simulator message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Social Media Simulator</h1>
        <p className="text-gray-500">Test the AI booking flow by simulating inbound messages</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <h3 className="font-medium">Channel</h3>
            <div className="space-y-2">
              {channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChannel(c.id)}
                  className={`flex w-full items-center p-3 rounded-md border transition-colors ${
                    channel === c.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <c.icon className={`h-5 w-5 mr-3 ${c.color}`} />
                  <span className="text-sm font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <h3 className="font-medium">User Context</h3>
            <div>
              <label className="text-xs text-gray-500 uppercase font-bold">External User ID</label>
              <input
                type="text"
                value={externalUserId}
                onChange={(e) => setExternalUserId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col h-[600px] bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center">
              <selectedChannel.icon className={`h-5 w-5 mr-2 ${selectedChannel.color}`} />
              <span className="font-medium">Chat with AI Agent</span>
            </div>
            <span className="text-xs text-green-600 font-medium">● Online</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 mt-10 text-sm italic">
                Send a message to start the conversation simulation.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    m.sender_type === 'patient'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 flex space-x-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
