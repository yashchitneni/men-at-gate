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
      badges: {
        Row: {
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          criteria_type: string
          criteria_value?: number
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      challenge_entries: {
        Row: {
          challenge_id: string
          created_at: string
          entry_date: string
          id: string
          notes: string | null
          user_id: string
          value: number
        }
        Insert: {
          challenge_id: string
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          user_id: string
          value?: number
        }
        Update: {
          challenge_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          chapter_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          metric: string | null
          name: string
          start_date: string
          target_value: number | null
        }
        Insert: {
          challenge_type?: string
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          metric?: string | null
          name: string
          start_date: string
          target_value?: number | null
        }
        Update: {
          challenge_type?: string
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          metric?: string | null
          name?: string
          start_date?: string
          target_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      chapters: {
        Row: {
          city: string
          created_at: string
          description: string | null
          founded_date: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          founded_date?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
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
            referencedRelation: "leaderboard"
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
      points_log: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_log_user_id_fkey"
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
          chapter_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          instagram_handle: string | null
          is_admin: boolean | null
          is_chapter_admin: boolean | null
          is_core_member: boolean | null
          is_featured: boolean | null
          is_super_admin: boolean | null
          mission: string | null
          phone: string | null
          role: string | null
          shirt_size: string | null
          strava_url: string | null
          twitter_handle: string | null
          updated_at: string
          why_i_joined: string | null
        }
        Insert: {
          bio?: string | null
          chapter_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          instagram_handle?: string | null
          is_admin?: boolean | null
          is_chapter_admin?: boolean | null
          is_core_member?: boolean | null
          is_featured?: boolean | null
          is_super_admin?: boolean | null
          mission?: string | null
          phone?: string | null
          role?: string | null
          shirt_size?: string | null
          strava_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          why_i_joined?: string | null
        }
        Update: {
          bio?: string | null
          chapter_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          is_admin?: boolean | null
          is_chapter_admin?: boolean | null
          is_core_member?: boolean | null
          is_featured?: boolean | null
          is_super_admin?: boolean | null
          mission?: string | null
          phone?: string | null
          role?: string | null
          shirt_size?: string | null
          strava_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          why_i_joined?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      race_participants: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          open_to_carpool: boolean | null
          open_to_split_lodging: boolean | null
          race_id: string
          selected_distance: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          open_to_carpool?: boolean | null
          open_to_split_lodging?: boolean | null
          race_id: string
          selected_distance?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          open_to_carpool?: boolean | null
          open_to_split_lodging?: boolean | null
          race_id?: string
          selected_distance?: string | null
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
            referencedRelation: "leaderboard"
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
          available_distances: Json | null
          chapter_id: string | null
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
          available_distances?: Json | null
          chapter_id?: string | null
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
          available_distances?: Json | null
          chapter_id?: string | null
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
            foreignKeyName: "races_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "leaderboard"
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      workout_attendance: {
        Row: {
          checked_in_by: string | null
          created_at: string
          id: string
          slot_id: string
          user_id: string
        }
        Insert: {
          checked_in_by?: string | null
          created_at?: string
          id?: string
          slot_id: string
          user_id: string
        }
        Update: {
          checked_in_by?: string | null
          created_at?: string
          id?: string
          slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
          {
            foreignKeyName: "workout_attendance_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "workout_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_attendance_user_id_fkey"
            columns: ["user_id"]
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
            referencedRelation: "leaderboard"
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
      workout_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          slot_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          slot_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          slot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_ratings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "workout_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
        ]
      }
      workout_slots: {
        Row: {
          chapter_id: string | null
          created_at: string
          description: string | null
          id: string
          leader_id: string | null
          reminder_sent: boolean | null
          status: string | null
          template_id: string | null
          theme: string | null
          updated_at: string
          workout_date: string
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          template_id?: string | null
          theme?: string | null
          updated_at?: string
          workout_date: string
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string | null
          reminder_sent?: boolean | null
          status?: string | null
          template_id?: string | null
          theme?: string | null
          updated_at?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_slots_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "leaderboard"
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
          {
            foreignKeyName: "workout_slots_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_submissions: {
        Row: {
          admin_feedback: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          feedback_requested_at: string | null
          feedback_requested_by: string | null
          id: string
          last_submitted_at: string | null
          leader_id: string | null
          leadership_note: string | null
          message: string | null
          slot_id: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          workout_plan: string
        }
        Insert: {
          admin_feedback?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          feedback_requested_at?: string | null
          feedback_requested_by?: string | null
          id?: string
          last_submitted_at?: string | null
          leader_id?: string | null
          leadership_note?: string | null
          message?: string | null
          slot_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          workout_plan: string
        }
        Update: {
          admin_feedback?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          feedback_requested_at?: string | null
          feedback_requested_by?: string | null
          id?: string
          last_submitted_at?: string | null
          leader_id?: string | null
          leadership_note?: string | null
          message?: string | null
          slot_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          workout_plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
          {
            foreignKeyName: "workout_submissions_feedback_requested_by_fkey"
            columns: ["feedback_requested_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_feedback_requested_by_fkey"
            columns: ["feedback_requested_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_feedback_requested_by_fkey"
            columns: ["feedback_requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_feedback_requested_by_fkey"
            columns: ["feedback_requested_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_feedback_requested_by_fkey"
            columns: ["feedback_requested_by"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
          {
            foreignKeyName: "workout_submissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "upcoming_workout"
            referencedColumns: ["leader_id"]
          },
          {
            foreignKeyName: "workout_submissions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "upcoming_workout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_submissions_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "workout_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_duration_min: number | null
          description: string | null
          exercises: Json | null
          format: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_duration_min?: number | null
          description?: string | null
          exercises?: Json | null
          format?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_duration_min?: number | null
          description?: string | null
          exercises?: Json | null
          format?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "core_roster"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_templates_created_by_fkey"
            columns: ["created_by"]
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
      leaderboard: {
        Row: {
          activities_count: number | null
          full_name: string | null
          id: string | null
          total_points: number | null
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
