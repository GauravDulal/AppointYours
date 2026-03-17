'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Phone, 
  Clock, 
  ChevronRight,
  Filter,
  Download,
  Plus
} from 'lucide-react';

type Appointment = {
  id: number;
  patient_id: number;
  service_id: number;
  start_at: string;
  status: string;
  source_channel: string;
  booked_by_ai: boolean;
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await api.get<Appointment[]>('/appointments');
        setAppointments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">Manage and track patient bookings from all channels</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border rounded-md text-sm font-medium bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" /> Export
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" /> New Booking
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex space-x-4">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              All Statuses
            </div>
            <div className="flex items-center text-sm font-medium text-gray-700">
              All Channels
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {appointments.length} appointments
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && (
            <div className="px-6 py-4 text-sm text-gray-500 border-b">Loading appointments...</div>
          )}
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b">
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500 italic">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{appt.patient_id}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Phone className="h-3 w-3 mr-1" /> View Profile
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{appt.service_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(appt.start_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Clock className="h-3 w-3 mr-1" /> 
                        {new Date(appt.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 capitalize">{appt.source_channel}</span>
                      {appt.booked_by_ai && (
                        <span className="ml-2 bg-purple-100 text-purple-700 text-[10px] px-1 rounded font-bold">AI</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                        Details <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
