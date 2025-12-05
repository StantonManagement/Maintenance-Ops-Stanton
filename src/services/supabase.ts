import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for AF_work_order_new table (read-only)
export type WorkOrderFromDB = {
  id: string
  Property: string
  PropertyName: string
  PropertyId: string
  PropertyAddress: string
  PropertyStreet1: string
  PropertyStreet2: string
  PropertyCity: string
  PropertyState: string
  PropertyZip: string
  UnitAddress: string
  UnitStreet: string
  UnitStreet2: string
  UnitCity: string
  UnitState: string
  UnitZip: string
  Priority: string
  WorkOrderType: string
  ServiceRequestNumber: string
  ServiceRequestDescription: string
  HomeWarrantyExpiration: string
  WorkOrderNumber: number
  JobDescription: string
  Instructions: string
  Status: string
  vendor_id: string
  Vendor: string
  UnitId: string
  UnitName: string
  OccupancyId: string
  PrimaryTenant: string
  PrimaryTenantEmail: string
  PrimaryTenantPhoneNumber: string
  CreatedAt: string
  CreatedBy: string
  AssignedUser: string
  WorkOrderId: string
  appfolio_collection: string
  last_synced: string
  created_at: string
  EstimateReqOn: string
  EstimatedOn: string
  EstimateAmount: number
  EstimateApprovalStatus: string
  EstimateApprovedOn: string
  EstimateApprovalLastRequestedOn: string
  ScheduledStart: string
  ScheduledEnd: string
  WorkDoneOn: string
  CompletedOn: string
}

// Types for work_order_actions table (writable)
export type WorkOrderAction = {
  id: string
  work_order_id: string
  action_type: 'status_change' | 'assignment' | 'note' | 'photo' | 'scheduling' | 'approval'
  action_data: Record<string, any>
  created_at: string
  created_by: string
  photos?: string[]
}

// Database table names
export const TABLES = {
  WORK_ORDERS: 'AF_work_order_new',
  WORK_ORDER_ACTIONS: 'work_order_actions',
  VOICE_SUBMISSIONS: 'voice_submissions'
} as const

// Types for voice_submissions table
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



