export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      test_categories: {
        Row: {
          id: string;
          slug: string;
          title_ar: string;
          title_en: string | null;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title_ar: string;
          title_en?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["test_categories"]["Insert"]
        >;
        Relationships: [];
      };
      tests: {
        Row: {
          id: string;
          slug: string;
          category: string | null;
          title_ar: string;
          title_en: string | null;
          description_ar: string;
          description_en: string | null;
          long_description_ar: string | null;
          long_description_en: string | null;
          clinical_use_ar: string | null;
          clinical_use_en: string | null;
          sample_ar: string | null;
          sample_en: string | null;
          method_ar: string | null;
          method_en: string | null;
          turnaround_ar: string | null;
          turnaround_en: string | null;
          price_display_ar: string | null;
          price_display_en: string | null;
          preparation_ar: string | null;
          preparation_en: string | null;
          limitation_note_ar: string | null;
          limitation_note_en: string | null;
          image_url: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          category?: string | null;
          title_ar: string;
          title_en?: string | null;
          description_ar: string;
          description_en?: string | null;
          long_description_ar?: string | null;
          long_description_en?: string | null;
          clinical_use_ar?: string | null;
          clinical_use_en?: string | null;
          sample_ar?: string | null;
          sample_en?: string | null;
          method_ar?: string | null;
          method_en?: string | null;
          turnaround_ar?: string | null;
          turnaround_en?: string | null;
          price_display_ar?: string | null;
          price_display_en?: string | null;
          preparation_ar?: string | null;
          preparation_en?: string | null;
          limitation_note_ar?: string | null;
          limitation_note_en?: string | null;
          image_url?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tests"]["Insert"]>;
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          preferred_date: string | null;
          test_slug: string | null;
          notes: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          preferred_date?: string | null;
          test_slug?: string | null;
          notes?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title_ar: string;
          title_en: string;
          description_ar: string;
          description_en: string;
          body_ar: string;
          body_en: string;
          event_date: string;
          location_ar: string | null;
          location_en: string | null;
          image_url: string | null;
          published: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title_ar: string;
          title_en: string;
          description_ar: string;
          description_en: string;
          body_ar?: string;
          body_en?: string;
          event_date: string;
          location_ar?: string | null;
          location_en?: string | null;
          image_url?: string | null;
          published?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      news: {
        Row: {
          id: string;
          title_ar: string;
          title_en: string;
          summary_ar: string;
          summary_en: string;
          body_ar: string;
          body_en: string;
          cover_image_url: string | null;
          published: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title_ar: string;
          title_en: string;
          summary_ar: string;
          summary_en: string;
          body_ar: string;
          body_en: string;
          cover_image_url?: string | null;
          published?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
        Relationships: [];
      };
      news_images: {
        Row: {
          id: string;
          news_id: string;
          image_url: string;
          sort_order: number;
          caption_ar: string | null;
          caption_en: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          news_id: string;
          image_url: string;
          sort_order?: number;
          caption_ar?: string | null;
          caption_en?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["news_images"]["Insert"]>;
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          data: Json;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          data: Json;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["site_content"]["Insert"]>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          message: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          message: string;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["contact_messages"]["Insert"]
        >;
        Relationships: [];
      };
      partner_lab_users: {
        Row: {
          user_id: string;
          lab_display_name: string;
          partner_username: string | null;
          country_code: string | null;
          governorate_id: string | null;
          region_id: string | null;
          is_locked: boolean;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          lab_display_name: string;
          partner_username?: string | null;
          country_code?: string | null;
          governorate_id?: string | null;
          region_id?: string | null;
          is_locked?: boolean;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["partner_lab_users"]["Insert"]
        >;
        Relationships: [];
      };
      partner_report_ready_seen: {
        Row: {
          partner_user_id: string;
          submission_id: string;
          seen_at: string;
        };
        Insert: {
          partner_user_id: string;
          submission_id: string;
          seen_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["partner_report_ready_seen"]["Insert"]
        >;
        Relationships: [];
      };
      partner_submissions: {
        Row: {
          id: string;
          partner_user_id: string;
          batch_id: string | null;
          patient_full_name: string;
          age_value: number;
          age_unit: string;
          test_slug: string;
          test_title_override: string | null;
          status: string;
          pdf_storage_path: string | null;
          pdf_expires_at: string | null;
          report_first_opened_at: string | null;
          rejection_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          partner_user_id: string;
          batch_id?: string | null;
          patient_full_name: string;
          age_value: number;
          age_unit: string;
          test_slug: string;
          test_title_override?: string | null;
          status?: string;
          pdf_storage_path?: string | null;
          pdf_expires_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["partner_submissions"]["Insert"]
        >;
        Relationships: [];
      };
      doctor_users: {
        Row: {
          user_id: string;
          display_name: string;
          doctor_username: string | null;
          is_locked: boolean;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          display_name: string;
          doctor_username?: string | null;
          is_locked?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_users"]["Insert"]>;
        Relationships: [];
      };
      doctor_report_ready_seen: {
        Row: {
          doctor_user_id: string;
          case_id: string;
          seen_at: string;
        };
        Insert: {
          doctor_user_id: string;
          case_id: string;
          seen_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["doctor_report_ready_seen"]["Insert"]
        >;
        Relationships: [];
      };
      doctor_cases: {
        Row: {
          id: string;
          doctor_user_id: string;
          patient_name1: string;
          patient_name2: string;
          patient_name3: string;
          patient_name4: string;
          patient_full_name: string;
          age_value: number;
          age_unit: string;
          gender: string;
          diagnosis: string;
          disease_type: string;
          disease_type_other: string | null;
          oncology_tumor_type: string | null;
          oncology_stage: string | null;
          oncology_treatment: string | null;
          status: string;
          rejection_reason: string | null;
          pdf_storage_path: string | null;
          pdf_expires_at: string | null;
          result_value: string | null;
          report_first_opened_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          doctor_user_id: string;
          patient_name1: string;
          patient_name2: string;
          patient_name3: string;
          patient_name4: string;
          patient_full_name: string;
          age_value: number;
          age_unit: string;
          gender: string;
          diagnosis: string;
          disease_type: string;
          disease_type_other?: string | null;
          oncology_tumor_type?: string | null;
          oncology_stage?: string | null;
          oncology_treatment?: string | null;
          status?: string;
          rejection_reason?: string | null;
          pdf_storage_path?: string | null;
          pdf_expires_at?: string | null;
          result_value?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["doctor_cases"]["Insert"]>;
        Relationships: [];
      };
      doctor_case_tests: {
        Row: {
          id: string;
          case_id: string;
          test_slug: string;
          test_title_override: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          case_id: string;
          test_slug: string;
          test_title_override?: string | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["doctor_case_tests"]["Insert"]
        >;
        Relationships: [];
      };
      doctor_case_files: {
        Row: {
          id: string;
          case_id: string;
          doctor_user_id: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          byte_size: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          case_id: string;
          doctor_user_id: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          byte_size?: number | null;
          created_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["doctor_case_files"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_partner_lab: {
        Args: Record<PropertyKey, never>;
        Returns: { lab_display_name: string }[];
      };
      partner_resolve_login: {
        Args: { p_username: string };
        Returns: { email: string }[];
      };
      partner_lab_users_admin_list: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          email: string;
          lab_display_name: string;
          partner_username: string | null;
          country_code: string | null;
          governorate_id: string | null;
          region_id: string | null;
          is_locked: boolean;
          created_at: string | null;
        }[];
      };
      partner_submissions_admin_list: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["partner_submissions"]["Row"][];
      };
      partner_submission_mark_group_seen: {
        Args: { p_group_key: string };
        Returns: undefined;
      };
      partner_submission_seen_group_keys: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      partner_submission_mark_report_opened: {
        Args: { p_submission_id: string };
        Returns: string;
      };
      get_my_doctor_profile: {
        Args: Record<PropertyKey, never>;
        Returns: { display_name: string }[];
      };
      doctor_resolve_login: {
        Args: { p_username: string };
        Returns: { email: string }[];
      };
      doctor_users_admin_list: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          email: string;
          display_name: string;
          doctor_username: string | null;
          is_locked: boolean;
          created_at: string | null;
        }[];
      };
      doctor_case_admin_set_status: {
        Args: {
          p_case_id: string;
          p_status: string;
          p_rejection_reason?: string | null;
        };
        Returns: undefined;
      };
      doctor_case_mark_report_opened: {
        Args: { p_case_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TestRow = Database["public"]["Tables"]["tests"]["Row"];
