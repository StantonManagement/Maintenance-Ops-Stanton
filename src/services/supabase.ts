import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export type helpers for convenience and backward compatibility
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Re-export specific types used in the app, mapped to the new schema
export type VendorDB = Tables<'vendors'>
export type TechnicianDB = Tables<'technicians'>
export type WorkOrderFromDB = Tables<'work_orders'>
export type MessageDB = Tables<'messages'>
export type PortfolioDB = Tables<'portfolios'>
export type PropertyDB = Tables<'properties'>
// Mapping some that might need manual alignment if schema differs slightly, 
// or just use the new schema types. 
// For now, these direct maps should work if the schema I created matches what the app expects.
// If not, I might need to add some manual fields or intersections.

// Preserving types that don't map directly to new tables yet or differ significantly
export type SensorDB = {
  id: string
  unit_id: string | null
  property_id: string | null
  type: string
  name: string
  battery_level: number | null
  last_reading_at: string | null
  last_reading: any
  thresholds?: any
  is_active: boolean
  created_at: string
}

export type SensorAlertDB = {
  id: string
  sensor_id: string
  type: string
  reading_value: number | null
  message: string
  work_order_id: string | null
  acknowledged_at: string | null
  acknowledged_by: string | null
  created_at: string
  sensors?: SensorDB
}

export type BusinessRuleDB = {
  id: string
  name: string
  description: string | null
  type: string
  trigger_event: string
  is_active: boolean
  conditions: any
  actions: any
  fire_count: number
  override_count: number
  version: number
  created_by: string
  created_at: string
  updated_at: string
}

export type RegionDB = {
  id: string
  portfolio_id: string
  name: string
  created_at?: string
}

export type PropertyPortfolioMappingDB = {
  property_id: string
  property_name: string | null
  address: string | null
  city: string | null
  state: string | null
  region_id: string | null
  portfolio_id: string | null
  unit_count: number | null
}

export type TenantPortalSessionDB = {
  id: string
  phone: string
  verification_code: string
  verified_at: string | null
  unit_id: string | null
  property_id: string | null
  created_at: string
}

export type TenantPortalRequestDB = {
  id: string
  session_id: string
  phone: string
  category: string
  description: string
  permission_to_enter: string
  urgency: string
  preferred_time: string | null
  photos: string[] | null
  work_order_id: string | null
  status: string
  created_at: string
}

export type TenantMessageDB = {
  id: string
  request_id: string
  sender_type: string
  message: string
  created_at: string
}

export type WorkOrderAction = {
  id: string
  work_order_id: string
  action_type: 'status_change' | 'assignment' | 'note' | 'photo' | 'scheduling' | 'approval'
  action_data: Record<string, any>
  created_at: string
  created_by: string
  photos?: string[]
}

export type VoiceSubmissionDB = {
  id: string
  source: 'telegram' | 'twilio' | 'voicemail' | 'manual'
  audio_url?: string
  transcription: string
  detected_language: string
  extracted_data: Record<string, any>
  status: 'pending' | 'processing' | 'ready' | 'created' | 'discarded'
  work_order_id?: string
  created_at: string
  processed_at?: string
  created_by: string
}

export type PreventiveScheduleDB = {
  id: string
  name: string
  description: string | null
  frequency_type: string
  frequency_value: number
  seasonal_trigger: string | null
  property_ids: string[] | null
  unit_ids: string[] | null
  equipment_type: string | null
  is_active: boolean
  last_generated: string | null
  next_due: string
  created_at: string
  updated_at: string
  category: string | null
  estimated_duration_hours: number | null
  checklist_items: string[] | null
}

export type ComplianceDeadlineDB = {
  id: string
  type: string
  property_id: string
  property_name: string | null
  unit_id: string | null
  unit_name: string | null
  deadline: string
  status: string
  last_inspection: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type WorkOrderResponsibilityDB = {
  id: string
  work_order_id: string
  responsible_party: string
  reason: string
  amount: number | null
  created_at: string
}

export type TenantChargeDB = {
  id: string
  work_order_id: string
  amount: number
  description: string
  status: string
  created_at: string
}

export type WorkOrderAssignmentDB = {
  id: string
  work_order_id: string
  technician_id: string
  scheduled_date: string
  status: string
  notes: string | null
  created_at: string
}

export type PhotoAnalysisResultDB = {
  id: string
  work_order_id: string
  overall_confidence: number
  completeness_score: number
  before_after_score: number
  cleanup_score: number
  quality_score: number
  location_score: number
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT'
  issues_found: string[]
  ai_notes: string
  analyzed_at: string
}

export type EventLogDB = {
  id: string
  work_order_id: string
  event_type: 'created' | 'assigned' | 'started' | 'completed' | 'cancelled'
  event_timestamp: string
  actor_id?: string
  actor_type?: 'system' | 'coordinator' | 'technician' | 'tenant'
  metadata?: Record<string, any>
  created_at: string
}

export type ReviewDB = {
  id: string
  work_order_id: string
  tenant_id?: string
  rating: number
  feedback?: string
  review_type: string
  submitted_at: string
  metadata?: Record<string, any>
}

export type WorkOrderPhotoDB = {
  id: string
  work_order_id: string
  photo_type: 'before' | 'after' | 'cleanup' | 'other'
  storage_url: string
  gps_lat?: number
  gps_lng?: number
  captured_at?: string
  created_at: string
}

export const TABLES = {
  WORK_ORDERS: 'work_orders', // Updated from AF_work_order_new
  WORK_ORDER_ACTIONS: 'work_order_actions',
  VOICE_SUBMISSIONS: 'voice_submissions'
} as const
