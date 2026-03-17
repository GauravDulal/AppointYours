'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2
} from 'lucide-react';

type AvailabilityRule = {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
};

type BlockedDate = {
  id: number;
  date: string;
  reason?: string;
};

export default function AvailabilityPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rulesData = await api.get<AvailabilityRule[]>('/availability/rules');
        const blockedData = await api.get<BlockedDate[]>('/availability/blocked');
        setRules(rulesData);
        setBlocked(blockedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
        <p className="text-sm text-gray-500">Configure your clinic&apos;s working hours and blocked dates</p>
      </div>

      {loading && (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-500">Loading availability settings...</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Working Hours */}
        <div className="bg-white rounded-lg border shadow-sm flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" /> Working Hours
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
              <Plus className="h-4 w-4 mr-1" /> Add Rule
            </button>
          </div>
          <div className="p-4 space-y-4">
            {rules.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">No rules configured. Please add your working hours.</p>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-bold w-24">
                      {weekdays[rule.weekday]}
                    </span>
                    <span className="text-sm text-gray-600">
                      {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="bg-white rounded-lg border shadow-sm flex flex-col">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-red-600" /> Blocked Dates
            </h3>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
              <Plus className="h-4 w-4 mr-1" /> Block Date
            </button>
          </div>
          <div className="p-4 space-y-4">
            {blocked.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">No blocked dates currently set.</p>
            ) : (
              blocked.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <span className="text-sm font-bold block">
                      {new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                    <span className="text-xs text-gray-500">{item.reason || 'No reason specified'}</span>
                  </div>
                  <button className="text-gray-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
