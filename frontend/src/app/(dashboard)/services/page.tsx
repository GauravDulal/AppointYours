'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Stethoscope, 
  Clock, 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

type Service = {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await api.get<Service[]>('/services');
        setServices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dental Services</h1>
          <p className="text-sm text-gray-500">Manage the services offered by your clinic and their durations</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="md:col-span-2 lg:col-span-3 rounded-lg border bg-white p-4 text-sm text-gray-500">
            Loading services...
          </div>
        )}
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{service.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t text-sm">
              <div className="flex items-center text-gray-700">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {service.duration_minutes} mins
              </div>
              <div className="flex items-center text-gray-700 font-semibold">
                <DollarSign className="h-4 w-4 mr-0.5 text-gray-400" />
                {service.price}
              </div>
            </div>

            <div className="flex items-center mt-2">
              {service.is_active ? (
                <span className="flex items-center text-xs text-green-600 font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                </span>
              ) : (
                <span className="flex items-center text-xs text-red-600 font-medium">
                  <XCircle className="h-3 w-3 mr-1" /> Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
