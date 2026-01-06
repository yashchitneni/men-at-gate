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
      member_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          instagram_handle: string | null
          is_admin: boolean | null
          is_core_member: boolean | null
          mission: string | null
          phone: string | null
          role: string | null
          shirt_size: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          is_admin?: boolean | null
          is_core_member?: boolean | null
          mission?: string | null
          phone?: string | null
          role?: string | null
          shirt_size?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          is_admin?: boolean | null
          is_core_member?: boolean | null
          mission?: string | null
          phone?: string | null
          role?: string | null
          shirt_size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      race_participants: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          open_to_carpool: boolean | null
          open_to_split_lodging: boolean | null
          race_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          open_to_carpool?: boolean | null
          open_to_split_lodging?: boolean | null
          race_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          open_to_carpool?: boolean | null
          open_to_split_lodging?: boolean | null
          race_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_participants_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      races: {
        Row: {
          created_at: string
          description: string | null
          distance_type: string
          id: string
          location: string
          race_date: string
          race_name: string
          registration_url: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          distance_type: string
          id?: string
          location: string
          race_date: string
          race_name: string
          registration_url?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          distance_type?: string
          id?: string
          location?: string
          race_date?: string
          race_name?: string
          registration_url?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "races_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "races_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      workout_interest: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preferred_dates: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_dates?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_dates?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_interest_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      workout_slots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          reminder_sent: boolean | null
          status: string | null
          theme: string | null
          updated_at: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          workout_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          theme?: string | null
          updated_at?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_slots_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_slots_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_slots_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_slots_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
    }
    Views: {
      core_roster: {
        Row: {
          bio: string | null
          full_name: string | null
          id: string | null
          instagram_handle: string | null
          mission: string | null
          primary_photo_url: string | null
          role: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          bio: string | null
          full_name: string | null
          id: string | null
          instagram_handle: string | null
          is_core_member: boolean | null
          mission: string | null
          role: string | null
        }
        Insert: {
          bio?: string | null
          full_name?: string | null
          id?: string | null
          instagram_handle?: string | null
          is_core_member?: boolean | null
          mission?: string | null
          role?: string | null
        }
        Update: {
          bio?: string | null
          full_name?: string | null
          id?: string | null
          instagram_handle?: string | null
          is_core_member?: boolean | null
          mission?: string | null
          role?: string | null
        }
        Relationships: []
      }
      upcoming_workout: {
        Row: {
          description: string | null
          id: string | null
          leader_id: string | null
          leader_name: string | null
          leader_photo_url: string | null
          status: string | null
          theme: string | null
          workout_date: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
