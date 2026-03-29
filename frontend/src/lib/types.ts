// ---------------------------------------------------------------------------
// Centralized TypeScript types for all API responses
// ---------------------------------------------------------------------------

export type AppointmentStatus = 'pending' | 'booked' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';
export type ConversationStatus = 'active' | 'resolved' | 'follow_up';
export type MessageSenderType = 'patient' | 'assistant' | 'staff' | 'system';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Patient {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price?: number | null;
  is_active: boolean;
}

export interface AvailabilityRule {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BlockedDate {
  id: number;
  date: string;
  reason?: string | null;
}

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  service_id: number;
  service_name: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source_channel: string;
  booked_by_ai: boolean;
  notes?: string | null;
  created_at: string;
}

export interface AppointmentSummary {
  total: number;
  booked: number;
  completed: number;
  cancelled: number;
  completion_rate_pct: number;
  cancellation_rate_pct: number;
}

export interface ChatMessage {
  id: number;
  sender_type: MessageSenderType;
  content: string;
  conversation_id: number;
  timestamp: string;
  external_message_id?: string | null;
}

export interface Conversation {
  id: number;
  source_channel: string;
  external_user_id: string;
  status: ConversationStatus;
  detected_intent?: string | null;
  urgency_flag: boolean;
  ai_summary?: string | null;
  patient_id?: number | null;
  appointment_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  messages: ChatMessage[];
}

export interface ConversationSummaryStats {
  total_active: number;
  total_urgent: number;
  total_resolved: number;
  total_follow_up: number;
}

export interface ClinicSettings {
  id: number;
  clinic_name: string;
  clinic_email: string;
  address?: string | null;
  hours_note?: string | null;
  reminder_lead_time_hours: number;
  timezone: string;
}

// Payload types for creating/updating
export interface AppointmentPayload {
  patient_id: number;
  service_id: number;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  source_channel: string;
  booked_by_ai: boolean;
  notes?: string;
}

export interface ServicePayload {
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active?: boolean;
}

export interface AvailabilityRulePayload {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface BlockedDatePayload {
  date: string;
  reason?: string;
}
