export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_display_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_display_name?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bike_lock_codes: {
        Row: {
          bike_id: number
          created_at: string
          id: string
          lock_code: string
          updated_at: string
        }
        Insert: {
          bike_id: number
          created_at?: string
          id?: string
          lock_code: string
          updated_at?: string
        }
        Update: {
          bike_id?: number
          created_at?: string
          id?: string
          lock_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bike_lock_codes_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: true
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      bikes: {
        Row: {
          created_at: string
          id: number
          size: string
          status: string
          sticker_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          size: string
          status?: string
          sticker_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          size?: string
          status?: string
          sticker_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_creation_attempts: {
        Row: {
          attempted_at: string | null
          client_identifier: string
          id: string
          was_successful: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          client_identifier: string
          id?: string
          was_successful?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          client_identifier?: string
          id?: string
          was_successful?: boolean | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          bike_condition_confirmed: boolean | null
          coupon_code: string | null
          created_at: string
          date: string
          documents_urls: string[] | null
          email: string
          id: string
          legal_accepted: boolean | null
          payment_method: string | null
          phone: string
          picnic: Json | null
          return_photos: string[] | null
          riders: Json
          safety_briefing_completed: boolean | null
          security_hold: number | null
          session: string
          signature_url: string | null
          status: string
          total_price: number
          updated_at: string
          waiver_accepted_at: string | null
          waiver_version: string | null
        }
        Insert: {
          bike_condition_confirmed?: boolean | null
          coupon_code?: string | null
          created_at?: string
          date: string
          documents_urls?: string[] | null
          email: string
          id?: string
          legal_accepted?: boolean | null
          payment_method?: string | null
          phone: string
          picnic?: Json | null
          return_photos?: string[] | null
          riders?: Json
          safety_briefing_completed?: boolean | null
          security_hold?: number | null
          session: string
          signature_url?: string | null
          status?: string
          total_price: number
          updated_at?: string
          waiver_accepted_at?: string | null
          waiver_version?: string | null
        }
        Update: {
          bike_condition_confirmed?: boolean | null
          coupon_code?: string | null
          created_at?: string
          date?: string
          documents_urls?: string[] | null
          email?: string
          id?: string
          legal_accepted?: boolean | null
          payment_method?: string | null
          phone?: string
          picnic?: Json | null
          return_photos?: string[] | null
          riders?: Json
          safety_briefing_completed?: boolean | null
          security_hold?: number | null
          session?: string
          signature_url?: string | null
          status?: string
          total_price?: number
          updated_at?: string
          waiver_accepted_at?: string | null
          waiver_version?: string | null
        }
        Relationships: []
      }
      coupon_validation_attempts: {
        Row: {
          attempted_at: string | null
          client_identifier: string
          code_attempted: string
          id: string
          was_valid: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          client_identifier: string
          code_attempted: string
          id?: string
          was_valid?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          client_identifier?: string
          code_attempted?: string
          id?: string
          was_valid?: boolean | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          booking_id: string | null
          code: string
          created_at: string
          discount: number
          discount_type: string
          id: string
          is_manual: boolean | null
          used_at: string | null
          used_by_booking_id: string | null
          verification_email: string | null
          verified: boolean | null
        }
        Insert: {
          booking_id?: string | null
          code: string
          created_at?: string
          discount: number
          discount_type: string
          id?: string
          is_manual?: boolean | null
          used_at?: string | null
          used_by_booking_id?: string | null
          verification_email?: string | null
          verified?: boolean | null
        }
        Update: {
          booking_id?: string | null
          code?: string
          created_at?: string
          discount?: number
          discount_type?: string
          id?: string
          is_manual?: boolean | null
          used_at?: string | null
          used_by_booking_id?: string | null
          verification_email?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_used_by_booking_id_fkey"
            columns: ["used_by_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      height_ranges: {
        Row: {
          id: string
          max_height: number
          min_height: number
          size: string
        }
        Insert: {
          id?: string
          max_height: number
          min_height: number
          size: string
        }
        Update: {
          id?: string
          max_height?: number
          min_height?: number
          size?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string | null
          client_identifier: string
          id: string
          username_attempted: string
        }
        Insert: {
          attempted_at?: string | null
          client_identifier: string
          id?: string
          username_attempted: string
        }
        Update: {
          attempted_at?: string | null
          client_identifier?: string
          id?: string
          username_attempted?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          bike_id: number
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string
          id: string
        }
        Insert: {
          bike_id: number
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          bike_id?: number
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_issues: {
        Row: {
          bike_id: number
          created_at: string
          description: string | null
          id: string
          issue_type: string
          reported_at: string
          resolved: boolean | null
          resolved_at: string | null
        }
        Insert: {
          bike_id: number
          created_at?: string
          description?: string | null
          id?: string
          issue_type: string
          reported_at?: string
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Update: {
          bike_id?: number
          created_at?: string
          description?: string | null
          id?: string
          issue_type?: string
          reported_at?: string
          resolved?: boolean | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_issues_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_inventory: {
        Row: {
          created_at: string
          id: string
          min_quantity: number
          name: string
          needs_order: boolean | null
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_quantity?: number
          name: string
          needs_order?: boolean | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_quantity?: number
          name?: string
          needs_order?: boolean | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_enabled: boolean | null
          method_key: string
          name_en: string
          name_he: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          method_key: string
          name_en: string
          name_he: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          method_key?: string
          name_en?: string
          name_he?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      picnic_menu: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_he: string | null
          id: string
          is_available: boolean
          name: string
          name_he: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          description_he?: string | null
          id?: string
          is_available?: boolean
          name: string
          name_he: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_he?: string | null
          id?: string
          is_available?: boolean
          name?: string
          name_he?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_settings: {
        Row: {
          created_at: string | null
          disabled_message_en: string | null
          disabled_message_he: string | null
          end_date: string | null
          id: string
          is_enabled: boolean | null
          season: string | null
          session_type: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled_message_en?: string | null
          disabled_message_he?: string | null
          end_date?: string | null
          id?: string
          is_enabled?: boolean | null
          season?: string | null
          session_type: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled_message_en?: string | null
          disabled_message_he?: string | null
          end_date?: string | null
          id?: string
          is_enabled?: boolean | null
          season?: string | null
          session_type?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content_key: string
          content_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          section: string
          sort_order: number | null
          updated_at: string | null
          value_en: string | null
          value_he: string | null
        }
        Insert: {
          content_key: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          section: string
          sort_order?: number | null
          updated_at?: string | null
          value_en?: string | null
          value_he?: string | null
        }
        Update: {
          content_key?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          section?: string
          sort_order?: number | null
          updated_at?: string | null
          value_en?: string | null
          value_he?: string | null
        }
        Relationships: []
      }
      site_content_history: {
        Row: {
          change_type: string
          changed_at: string | null
          changed_by: string | null
          content_id: string | null
          id: string
          metadata: Json | null
          value_en: string | null
          value_he: string | null
          version_number: number
        }
        Insert: {
          change_type: string
          changed_at?: string | null
          changed_by?: string | null
          content_id?: string | null
          id?: string
          metadata?: Json | null
          value_en?: string | null
          value_he?: string | null
          version_number?: number
        }
        Update: {
          change_type?: string
          changed_at?: string | null
          changed_by?: string | null
          content_id?: string | null
          id?: string
          metadata?: Json | null
          value_en?: string | null
          value_he?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "site_content_history_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "site_content"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiting_list_leads: {
        Row: {
          created_at: string
          documents_urls: string[] | null
          email: string | null
          id: string
          name: string
          phone: string | null
          signature_url: string | null
          waiver_accepted_at: string | null
          waiver_version: string | null
        }
        Insert: {
          created_at?: string
          documents_urls?: string[] | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          signature_url?: string | null
          waiver_accepted_at?: string | null
          waiver_version?: string | null
        }
        Update: {
          created_at?: string
          documents_urls?: string[] | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          signature_url?: string | null
          waiver_accepted_at?: string | null
          waiver_version?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_booking_public: {
        Args: { _booking_id: string; _phone: string }
        Returns: boolean
      }
      check_booking_rate_limit: {
        Args: { _client_id: string }
        Returns: {
          allowed: boolean
          attempts_remaining: number
          retry_after_seconds: number
        }[]
      }
      cleanup_old_booking_attempts: { Args: never; Returns: undefined }
      cleanup_old_coupon_attempts: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      create_booking_public: {
        Args: {
          _coupon_code?: string
          _date: string
          _email: string
          _legal_accepted: boolean
          _payment_method: string
          _phone: string
          _picnic: Json
          _riders: Json
          _security_hold: number
          _session: string
          _status: string
          _total_price: number
        }
        Returns: string
      }
      get_booking_by_id: {
        Args: { booking_uuid: string }
        Returns: {
          bike_condition_confirmed: boolean
          coupon_code: string
          created_at: string
          date: string
          email: string
          id: string
          legal_accepted: boolean
          payment_method: string
          phone: string
          picnic: Json
          return_photos: string[]
          riders: Json
          safety_briefing_completed: boolean
          security_hold: number
          session: string
          status: string
          total_price: number
        }[]
      }
      get_bookings_by_contact: {
        Args: { _phone_or_email: string }
        Returns: {
          created_at: string
          date: string
          email: string
          id: string
          phone: string
          picnic: Json
          riders: Json
          session: string
          status: string
          total_price: number
        }[]
      }
      get_email_by_display_name: {
        Args: { _client_id?: string; _display_name: string }
        Returns: string
      }
      get_mechanic_bookings: {
        Args: { _date: string }
        Returns: {
          bike_condition_confirmed: boolean
          date: string
          id: string
          riders: Json
          safety_briefing_completed: boolean
          session: string
          status: string
        }[]
      }
      get_public_availability: {
        Args: { _end_date: string; _session?: string; _start_date: string }
        Returns: {
          booked_count: number
          booking_date: string
          session_type: string
        }[]
      }
      get_public_availability_by_size: {
        Args: { _start_date: string; _end_date: string }
        Returns: {
          booking_date: string
          session_type: string
          bike_size: string
          booked_count: number
        }[]
      }
      get_public_bikes: {
        Args: never
        Returns: {
          created_at: string
          id: number
          size: string
          status: string
          sticker_number: string
          updated_at: string
        }[]
      }
      get_staff_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          phone: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_booking_attempt: {
        Args: { _client_id: string; _was_successful: boolean }
        Returns: undefined
      }
      search_booking_public: {
        Args: { _phone_or_email: string; _search_query: string }
        Returns: {
          created_at: string
          date: string
          email: string
          id: string
          phone: string
          picnic: Json
          riders: Json
          session: string
          status: string
          total_price: number
        }[]
      }
      use_coupon_code: {
        Args: { _booking_id: string; _code: string }
        Returns: boolean
      }
      validate_coupon_code:
      | {
        Args: { _code: string }
        Returns: {
          discount: number
          discount_type: string
          error_message: string
          valid: boolean
        }[]
      }
      | {
        Args: { _client_id?: string; _code: string }
        Returns: {
          discount: number
          discount_type: string
          error_message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "mechanic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "mechanic"],
    },
  },
} as const
