export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          name: string
          code: string | null
          settings: Json
          appfolio_account_id: string | null
          subscription_tier: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          settings?: Json
          appfolio_account_id?: string | null
          subscription_tier?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          settings?: Json
          appfolio_account_id?: string | null
          subscription_tier?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_users: {
        Row: {
          portfolio_id: string
          user_id: string
          role: 'owner' | 'manager' | 'coordinator' | 'admin' | 'technician' | 'viewer'
          permissions: string[]
          created_at: string
          granted_by: string | null
        }
        Insert: {
          portfolio_id: string
          user_id: string
          role: 'owner' | 'manager' | 'coordinator' | 'admin' | 'technician' | 'viewer'
          permissions?: string[]
          created_at?: string
          granted_by?: string | null
        }
        Update: {
          portfolio_id?: string
          user_id?: string
          role?: 'owner' | 'manager' | 'coordinator' | 'admin' | 'technician' | 'viewer'
          permissions?: string[]
          created_at?: string
          granted_by?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          portfolio_id: string
          af_property_id: string | null
          name: string
          code: string | null
          address_street: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          address_full: string | null
          property_type: 'residential' | 'commercial' | 'mixed' | null
          section_8_status: string | null
          owner_entity: string | null
          manager_name: string | null
          manager_phone: string | null
          manager_email: string | null
          building_count: number
          unit_count: number
          settings: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          af_property_id?: string | null
          name: string
          code?: string | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_zip?: string | null
          address_full?: never // Generated column
          property_type?: 'residential' | 'commercial' | 'mixed' | null
          section_8_status?: string | null
          owner_entity?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_email?: string | null
          building_count?: number
          unit_count?: number
          settings?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          af_property_id?: string | null
          name?: string
          code?: string | null
          address_street?: string | null
          address_city?: string | null
          address_state?: string | null
          address_zip?: string | null
          address_full?: never // Generated column
          property_type?: 'residential' | 'commercial' | 'mixed' | null
          section_8_status?: string | null
          owner_entity?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_email?: string | null
          building_count?: number
          unit_count?: number
          settings?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          portfolio_id: string
          af_unit_id: string | null
          unit_number: string
          building_number: string | null
          floor: number | null
          bedrooms: number | null
          bathrooms: number | null
          square_feet: number | null
          rent_amount: number | null
          is_section_8: boolean
          tenant_id: string | null
          tenant_name: string | null
          tenant_phone: string | null
          tenant_email: string | null
          tenant_language: string | null
          lease_start: string | null
          lease_end: string | null
          status: 'occupied' | 'vacant' | 'notice_given' | 'make_ready' | null
          last_inspection_date: string | null
          next_inspection_date: string | null
          equipment: Json
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          portfolio_id: string
          af_unit_id?: string | null
          unit_number: string
          building_number?: string | null
          floor?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          rent_amount?: number | null
          is_section_8?: boolean
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_email?: string | null
          tenant_language?: string | null
          lease_start?: string | null
          lease_end?: string | null
          status?: 'occupied' | 'vacant' | 'notice_given' | 'make_ready' | null
          last_inspection_date?: string | null
          next_inspection_date?: string | null
          equipment?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          portfolio_id?: string
          af_unit_id?: string | null
          unit_number?: string
          building_number?: string | null
          floor?: number | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_feet?: number | null
          rent_amount?: number | null
          is_section_8?: boolean
          tenant_id?: string | null
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_email?: string | null
          tenant_language?: string | null
          lease_start?: string | null
          lease_end?: string | null
          status?: 'occupied' | 'vacant' | 'notice_given' | 'make_ready' | null
          last_inspection_date?: string | null
          next_inspection_date?: string | null
          equipment?: Json
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      technicians: {
        Row: {
          id: string
          user_id: string | null
          portfolio_id: string
          name: string
          phone: string | null
          email: string | null
          skills: string[]
          certifications: Json
          max_daily_orders: number
          hourly_rate: number | null
          is_available: boolean
          status: 'available' | 'on_job' | 'off_duty' | 'vacation' | null
          current_location: Json | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          portfolio_id: string
          name: string
          phone?: string | null
          email?: string | null
          skills?: string[]
          certifications?: Json
          max_daily_orders?: number
          hourly_rate?: number | null
          is_available?: boolean
          status?: 'available' | 'on_job' | 'off_duty' | 'vacation' | null
          current_location?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          portfolio_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          skills?: string[]
          certifications?: Json
          max_daily_orders?: number
          hourly_rate?: number | null
          is_available?: boolean
          status?: 'available' | 'on_job' | 'off_duty' | 'vacation' | null
          current_location?: Json | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          portfolio_id: string
          property_id: string
          unit_id: string | null
          af_work_order_id: string | null
          request_number: string | null
          description: string | null
          category: string | null
          priority: 'emergency' | 'high' | 'medium' | 'low' | null
          status: string | null
          source: string | null
          assigned_technician_id: string | null
          scheduled_date: string | null
          scheduled_time_start: string | null
          scheduled_time_end: string | null
          estimated_duration_hours: number | null
          tenant_name: string | null
          tenant_phone: string | null
          tenant_availability: string | null
          permission_to_enter: string | null
          access_instructions: string | null
          is_capex: boolean
          capex_reason: string | null
          section_8_category: string | null
          estimated_cost: number | null
          actual_cost: number | null
          parts_cost: number | null
          labor_cost: number | null
          completed_at: string | null
          completed_by: string | null
          completion_notes: string | null
          tenant_satisfaction: number | null
          first_time_fix: boolean | null
          deadline_date: string | null
          deadline_type: string | null
          exposure_amount: number | null
          has_unread_messages: boolean
          message_count: number
          photo_count: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          portfolio_id: string
          property_id: string
          unit_id?: string | null
          af_work_order_id?: string | null
          request_number?: string | null
          description?: string | null
          category?: string | null
          priority?: 'emergency' | 'high' | 'medium' | 'low' | null
          status?: string | null
          source?: string | null
          assigned_technician_id?: string | null
          scheduled_date?: string | null
          scheduled_time_start?: string | null
          scheduled_time_end?: string | null
          estimated_duration_hours?: number | null
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_availability?: string | null
          permission_to_enter?: string | null
          access_instructions?: string | null
          is_capex?: boolean
          capex_reason?: string | null
          section_8_category?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          parts_cost?: number | null
          labor_cost?: number | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          tenant_satisfaction?: number | null
          first_time_fix?: boolean | null
          deadline_date?: string | null
          deadline_type?: string | null
          exposure_amount?: number | null
          has_unread_messages?: boolean
          message_count?: number
          photo_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          portfolio_id?: string
          property_id?: string
          unit_id?: string | null
          af_work_order_id?: string | null
          request_number?: string | null
          description?: string | null
          category?: string | null
          priority?: 'emergency' | 'high' | 'medium' | 'low' | null
          status?: string | null
          source?: string | null
          assigned_technician_id?: string | null
          scheduled_date?: string | null
          scheduled_time_start?: string | null
          scheduled_time_end?: string | null
          estimated_duration_hours?: number | null
          tenant_name?: string | null
          tenant_phone?: string | null
          tenant_availability?: string | null
          permission_to_enter?: string | null
          access_instructions?: string | null
          is_capex?: boolean
          capex_reason?: string | null
          section_8_category?: string | null
          estimated_cost?: number | null
          actual_cost?: number | null
          parts_cost?: number | null
          labor_cost?: number | null
          completed_at?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          tenant_satisfaction?: number | null
          first_time_fix?: boolean | null
          deadline_date?: string | null
          deadline_type?: string | null
          exposure_amount?: number | null
          has_unread_messages?: boolean
          message_count?: number
          photo_count?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          portfolio_id: string
          work_order_id: string
          direction: 'inbound' | 'outbound' | null
          channel: 'sms' | 'email' | 'phone' | 'portal' | null
          sender_type: 'tenant' | 'coordinator' | 'technician' | 'system' | null
          sender_id: string | null
          sender_phone: string | null
          sender_name: string | null
          content: string | null
          content_translated: string | null
          original_language: string | null
          delivery_status: string | null
          read_at: string | null
          attachments: Json
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          work_order_id: string
          direction?: 'inbound' | 'outbound' | null
          channel?: 'sms' | 'email' | 'phone' | 'portal' | null
          sender_type?: 'tenant' | 'coordinator' | 'technician' | 'system' | null
          sender_id?: string | null
          sender_phone?: string | null
          sender_name?: string | null
          content?: string | null
          content_translated?: string | null
          original_language?: string | null
          delivery_status?: string | null
          read_at?: string | null
          attachments?: Json
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          work_order_id?: string
          direction?: 'inbound' | 'outbound' | null
          channel?: 'sms' | 'email' | 'phone' | 'portal' | null
          sender_type?: 'tenant' | 'coordinator' | 'technician' | 'system' | null
          sender_id?: string | null
          sender_phone?: string | null
          sender_name?: string | null
          content?: string | null
          content_translated?: string | null
          original_language?: string | null
          delivery_status?: string | null
          read_at?: string | null
          attachments?: Json
          created_at?: string
        }
      }
      approvals: {
        Row: {
          id: string
          portfolio_id: string
          work_order_id: string
          type: 'completion' | 'expense' | 'vendor' | 'override' | null
          status: 'pending' | 'approved' | 'rejected' | null
          submitted_by: string | null
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          amount: number | null
          vendor_name: string | null
          invoice_number: string | null
          before_photos: string[] | null
          after_photos: string[] | null
          cleanup_photos: string[] | null
          checklist: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          work_order_id: string
          type?: 'completion' | 'expense' | 'vendor' | 'override' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          amount?: number | null
          vendor_name?: string | null
          invoice_number?: string | null
          before_photos?: string[] | null
          after_photos?: string[] | null
          cleanup_photos?: string[] | null
          checklist?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          work_order_id?: string
          type?: 'completion' | 'expense' | 'vendor' | 'override' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          amount?: number | null
          vendor_name?: string | null
          invoice_number?: string | null
          before_photos?: string[] | null
          after_photos?: string[] | null
          cleanup_photos?: string[] | null
          checklist?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          portfolio_id: string
          name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          category: string | null
          specialties: string[] | null
          insurance_verified: boolean
          insurance_expiration: string | null
          license_number: string | null
          license_expiration: string | null
          hourly_rate: number | null
          emergency_rate: number | null
          response_time_hours: number | null
          rating: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          category?: string | null
          specialties?: string[] | null
          insurance_verified?: boolean
          insurance_expiration?: string | null
          license_number?: string | null
          license_expiration?: string | null
          hourly_rate?: number | null
          emergency_rate?: number | null
          response_time_hours?: number | null
          rating?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          category?: string | null
          specialties?: string[] | null
          insurance_verified?: boolean
          insurance_expiration?: string | null
          license_number?: string | null
          license_expiration?: string | null
          hourly_rate?: number | null
          emergency_rate?: number | null
          response_time_hours?: number | null
          rating?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string | null
          user_email: string | null
          user_role: string | null
          action: string | null
          entity_type: string | null
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          context: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          context?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string | null
          user_email?: string | null
          user_role?: string | null
          action?: string | null
          entity_type?: string | null
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          context?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_portfolio_ids: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
