export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          doctor_id: string | null
          due_date: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"] | null
          slot_id: string | null
          start_time: string
          status: string
          updated_at: string | null
          video_room_id: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          doctor_id?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"] | null
          slot_id?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          video_room_id?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          doctor_id?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"] | null
          slot_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          video_room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          created_at: string | null
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          city: string | null
          content: string
          created_at: string | null
          date_of_birth: string | null
          id: string
          is_read: boolean | null
          name: string
          neighborhood: string | null
          state: string | null
          street: string | null
          street_number: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          city?: string | null
          content: string
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          is_read?: boolean | null
          name?: string
          neighborhood?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          city?: string | null
          content?: string
          created_at?: string | null
          date_of_birth?: string | null
          id?: string
          is_read?: boolean | null
          name?: string
          neighborhood?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      doctor_availability: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          doctor_id: string
          id: string
          is_booked: boolean
          slot_datetime: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          doctor_id: string
          id?: string
          is_booked?: boolean
          slot_datetime: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_booked?: boolean
          slot_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_notes: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          notes: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          notes: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          notes?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          description: string | null
          doctor_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          patient_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          patient_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          doctor_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          diagnosis: string | null
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          prescription: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prescription?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prescription?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      owners_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owners_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_doctor_messages: {
        Row: {
          appointment_id: string | null
          content: string
          created_at: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          appointment_id?: string | null
          content: string
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          appointment_id?: string | null
          content?: string
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_doctor_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_doctor_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_doctor_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          consent_date: string | null
          consent_status: boolean | null
          created_at: string | null
          current_medications: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_doctor: boolean | null
          is_public: boolean | null
          main_complaints: string | null
          mental_health_history: string | null
          neighborhood: string | null
          past_sessions_history: string | null
          phone: string | null
          previous_diagnoses: string | null
          specialty: string | null
          state: string | null
          street: string | null
          street_number: string | null
          therapist_id: string | null
          updated_at: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          consent_date?: string | null
          consent_status?: boolean | null
          created_at?: string | null
          current_medications?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          is_doctor?: boolean | null
          is_public?: boolean | null
          main_complaints?: string | null
          mental_health_history?: string | null
          neighborhood?: string | null
          past_sessions_history?: string | null
          phone?: string | null
          previous_diagnoses?: string | null
          specialty?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          therapist_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          consent_date?: string | null
          consent_status?: boolean | null
          created_at?: string | null
          current_medications?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_doctor?: boolean | null
          is_public?: boolean | null
          main_complaints?: string | null
          mental_health_history?: string | null
          neighborhood?: string | null
          past_sessions_history?: string | null
          phone?: string | null
          previous_diagnoses?: string | null
          specialty?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          therapist_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          homework: string | null
          id: string
          interventions_used: string | null
          notes: string | null
          patient_id: string
          session_date: string
          session_theme: string | null
          therapist_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homework?: string | null
          id?: string
          interventions_used?: string | null
          notes?: string | null
          patient_id: string
          session_date: string
          session_theme?: string | null
          therapist_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homework?: string | null
          id?: string
          interventions_used?: string | null
          notes?: string | null
          patient_id?: string
          session_date?: string
          session_theme?: string | null
          therapist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_sessions: {
        Row: {
          answer: Json | null
          appointment_id: string | null
          created_at: string | null
          doctor_id: string | null
          ended_at: string | null
          id: string
          ice_candidates: Json | null
          offer: Json | null
          patient_id: string | null
          room_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          answer?: Json | null
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          ice_candidates?: Json | null
          offer?: Json | null
          patient_id?: string | null
          room_id: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          answer?: Json | null
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          ended_at?: string | null
          id?: string
          ice_candidates?: Json | null
          offer?: Json | null
          patient_id?: string | null
          room_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_transcriptions: {
        Row: {
          conversation_name: string | null
          created_at: string | null
          end_time: string | null
          id: string
          original_image_url: string | null
          start_time: string | null
          transcribed_text: string | null
          user_id: string
        }
        Insert: {
          conversation_name?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          original_image_url?: string | null
          start_time?: string | null
          transcribed_text?: string | null
          user_id: string
        }
        Update: {
          conversation_name?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          original_image_url?: string | null
          start_time?: string | null
          transcribed_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_transcriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_slot_and_create_appointment: {
        Args: {
          _doctor_id: string
          _end_time: string
          _patient_id: string
          _slot_id: string
          _start_time: string
        }
        Returns: { appointment_id: string }[]
      }
      get_appointments_for_doctor: {
        Args: Record<PropertyKey, never>
        Returns: {
          amount_paid: number | null
          appointment_id: string | null
          created_at: string | null
          doctor_id: string | null
          due_date: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_city: string | null
          patient_full_name: string | null
          patient_id: string
          patient_neighborhood: string | null
          patient_state: string | null
          patient_street: string | null
          patient_street_number: string | null
          patient_whatsapp: string | null
          patient_zip_code: string | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"] | null
          slot_id: string | null
          start_time: string
          status: string
          updated_at: string | null
          video_room_id: string | null
        }[]
      }
      get_doctor_available_dates: {
        Args: {
          _doctor_id: string
        }
        Returns: string[]
      }
      get_doctor_financial_dashboard_summary: {
        Args: {
          p_doctor_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: {
          paid_appointments_list: Json
          total_paid_amount: number
          total_unpaid_amount: number
          unpaid_appointments_list: Json
        }[]
      }
      get_doctor_profiles_by_ids: {
        Args: {
          _ids: string[]
        }
        Returns: { created_at: string | null; full_name: string | null; id: string }[]
      }
      get_doctors_public: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Tables"]["profiles"]["Row"][]
      }
      get_patients_for_doctor: {
        Args: {
          _show_inactive?: boolean
        }
        Returns: Database["public"]["Tables"]["profiles"]["Row"][]
      }
      get_truly_available_slots: {
        Args: {
          _doctor_id: string
          _end_time_lte: string
          _start_time_gte: string
        }
        Returns: Database["public"]["Tables"]["availability_slots"]["Row"][]
      }
      handle_new_message_notification: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reschedule_appointment_v2: {
        Args: {
          _appointment_id: string
          _doctor_id: string
          _new_end_time: string
          _new_slot_id: string
          _new_start_time: string
          _old_slot_id: string
        }
        Returns: { appointment_id: string }[]
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
      payment_status_enum: "pending" | "paid" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      PublicSchema["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never