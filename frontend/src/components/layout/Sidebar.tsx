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
  Smartphone,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { clearToken } from '@/lib/auth';

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
    <div className="gradient-sidebar flex h-screen w-64 flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          DentalFlow
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-widest text-blue-200/30">
          Menu
        </p>
        <nav className="space-y-0.5 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600/20 text-white shadow-sm'
                    : 'text-blue-100/50 hover:bg-white/5 hover:text-blue-100/80'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-[18px] w-[18px] transition-colors',
                    isActive
                      ? 'text-blue-400'
                      : 'text-blue-200/30 group-hover:text-blue-200/50'
                  )}
                />
                {item.name}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => {
            clearToken();
            window.location.href = '/login';
          }}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100/40 transition-all hover:bg-white/5 hover:text-blue-100/70"
        >
          <LogOut className="mr-3 h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );
}
