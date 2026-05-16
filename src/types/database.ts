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
      tests: {
        Row: {
          id: string
          slug: string
          category: string | null
          title_ar: string
          title_en: string | null
          description_ar: string
          description_en: string | null
          long_description_ar: string | null
          long_description_en: string | null
          clinical_use_ar: string | null
          clinical_use_en: string | null
          sample_ar: string | null
          sample_en: string | null
          method_ar: string | null
          method_en: string | null
          turnaround_ar: string | null
          turnaround_en: string | null
          price_display_ar: string | null
          price_display_en: string | null
          preparation_ar: string | null
          preparation_en: string | null
          limitation_note_ar: string | null
          limitation_note_en: string | null
          image_url: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          category?: string | null
          title_ar: string
          title_en?: string | null
          description_ar: string
          description_en?: string | null
          long_description_ar?: string | null
          long_description_en?: string | null
          clinical_use_ar?: string | null
          clinical_use_en?: string | null
          sample_ar?: string | null
          sample_en?: string | null
          method_ar?: string | null
          method_en?: string | null
          turnaround_ar?: string | null
          turnaround_en?: string | null
          price_display_ar?: string | null
          price_display_en?: string | null
          preparation_ar?: string | null
          preparation_en?: string | null
          limitation_note_ar?: string | null
          limitation_note_en?: string | null
          image_url?: string | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tests']['Insert']>
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          full_name: string
          phone: string
          email: string | null
          preferred_date: string | null
          test_slug: string | null
          notes: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          email?: string | null
          preferred_date?: string | null
          test_slug?: string | null
          notes?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title_ar: string
          title_en: string
          description_ar: string
          description_en: string
          event_date: string
          location_ar: string | null
          location_en: string | null
          image_url: string | null
          published: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          title_ar: string
          title_en: string
          description_ar: string
          description_en: string
          event_date: string
          location_ar?: string | null
          location_en?: string | null
          image_url?: string | null
          published?: boolean
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          data: Json
          updated_at: string | null
        }
        Insert: {
          key: string
          data: Json
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['site_content']['Insert']>
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string | null
          message: string
          created_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          message: string
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>
        Relationships: []
      }
      partner_lab_users: {
        Row: {
          user_id: string
          lab_display_name: string
          partner_username: string | null
          created_at: string | null
        }
        Insert: {
          user_id: string
          lab_display_name: string
          partner_username?: string | null
          created_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['partner_lab_users']['Insert']>
        Relationships: []
      }
      partner_submissions: {
        Row: {
          id: string
          partner_user_id: string
          patient_full_name: string
          age_value: number
          age_unit: string
          test_slug: string
          status: string
          pdf_storage_path: string | null
          pdf_expires_at: string | null
          rejection_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          partner_user_id: string
          patient_full_name: string
          age_value: number
          age_unit: string
          test_slug: string
          status?: string
          pdf_storage_path?: string | null
          pdf_expires_at?: string | null
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['partner_submissions']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_partner_lab: {
        Args: Record<PropertyKey, never>
        Returns: { lab_display_name: string }[]
      }
      partner_resolve_login: {
        Args: { p_username: string }
        Returns: { email: string }[]
      }
      partner_lab_users_admin_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          lab_display_name: string
          partner_username: string | null
          created_at: string | null
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TestRow = Database['public']['Tables']['tests']['Row']
