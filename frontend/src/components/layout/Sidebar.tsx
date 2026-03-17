'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  Stethoscope, 
  Clock, 
  AlertCircle, 
  BarChart3,
  LogOut,
  Smartphone
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Urgent Cases', href: '/urgent', icon: AlertCircle },
  { name: 'Availability', href: '/availability', icon: Clock },
  { name: 'Services', href: '/services', icon: Stethoscope },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Social Simulator', href: '/simulator', icon: Smartphone },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold text-blue-600">DentalFlow</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className={cn('mr-3 h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400" />
          Logout
        </button>
      </div>
    </div>
  );
}
