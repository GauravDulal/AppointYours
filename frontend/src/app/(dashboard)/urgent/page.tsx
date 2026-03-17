'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  AlertCircle, 
  MessageSquare, 
  User, 
  Clock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

type UrgentConversation = {
  id: number;
  external_user_id: string;
  source_channel: string;
  ai_summary?: string;
  updated_at?: string;
  created_at: string;
  messages?: { id: number }[];
};

export default function UrgentCasesPage() {
  const [conversations, setConversations] = useState<UrgentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUrgent() {
      try {
        const data = await api.get<UrgentConversation[]>('/conversations/urgent');
        setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadUrgent();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="bg-red-100 p-2 rounded-lg">
          <ShieldAlert className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Urgent Cases</h1>
          <p className="text-sm text-gray-500">High-priority inquiries that require immediate attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading && (
          <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">Loading urgent cases...</div>
        )}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">Clear Skies!</p>
            <p className="text-sm">There are no urgent cases flagged at the moment.</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="bg-white rounded-lg border-l-4 border-l-red-600 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {conv.external_user_id}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">
                      Channel: {conv.source_channel}
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Urgent
                  </span>
                </div>

                <div className="bg-red-50 p-4 rounded-md border border-red-100">
                  <p className="text-sm text-red-900 font-medium">Issue Summary</p>
                  <p className="text-sm text-red-800 mt-1">
                    {conv.ai_summary || 'The patient mentioned severe dental symptoms requiring immediate follow-up.'}
                  </p>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Last update: {new Date(conv.updated_at || conv.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    {conv.messages?.length || 0} messages
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 flex items-center justify-center border-t md:border-t-0 md:border-l">
                <button
                  onClick={() => window.location.href = `/conversations?id=${conv.id}`}
                  className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Join Conversation
                  <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
