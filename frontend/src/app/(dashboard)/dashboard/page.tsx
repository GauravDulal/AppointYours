'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  AlertCircle 
} from 'lucide-react';

type AppointmentSummary = {
  total: number;
  booked: number;
  completed: number;
  cancelled: number;
};

type UrgentConversation = {
  id: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AppointmentSummary>({ total: 0, booked: 0, completed: 0, cancelled: 0 });
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const stats = await api.get<AppointmentSummary>('/appointments/summary');
        setSummary(stats);
        
        const urgent = await api.get<UrgentConversation[]>('/conversations/urgent');
        setUrgentCount(urgent.length);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const stats = [
    { name: 'Total Bookings', value: summary.total, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Active Bookings', value: summary.booked, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Urgent Cases', value: urgentCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Pending Chats', value: 3, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Dr. Smith</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="flex flex-col rounded-lg bg-white p-6 shadow-sm border">
            <div className="flex items-center space-x-4">
              <div className={`${stat.bg} rounded-full p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
          <div className="space-y-4">
            {/* We'll add a list component here later */}
            <p className="text-sm text-gray-500 italic">No upcoming appointments for today.</p>
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Inquiries</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 italic">No recent social media inquiries.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
