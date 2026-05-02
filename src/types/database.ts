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
          title_ar: string
          description_ar: string
          long_description_ar: string | null
          image_url: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          title_ar: string
          description_ar: string
          long_description_ar?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TestRow = Database['public']['Tables']['tests']['Row']
