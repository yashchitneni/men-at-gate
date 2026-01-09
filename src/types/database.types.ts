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
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          instagram_handle: string | null;
          shirt_size: string | null;
          is_admin: boolean;
          is_super_admin: boolean;
          is_core_member: boolean;
          role: string | null;
          bio: string | null;
          mission: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          instagram_handle?: string | null;
          shirt_size?: string | null;
          is_admin?: boolean;
          is_super_admin?: boolean;
          is_core_member?: boolean;
          role?: string | null;
          bio?: string | null;
          mission?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          instagram_handle?: string | null;
          shirt_size?: string | null;
          is_admin?: boolean;
          is_super_admin?: boolean;
          is_core_member?: boolean;
          role?: string | null;
          bio?: string | null;
          mission?: string | null;
          updated_at?: string;
        };
      };
      member_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          photo_url?: string;
          is_primary?: boolean;
        };
      };
      races: {
        Row: {
          id: string;
          race_name: string;
          race_date: string;
          location: string;
          distance_type: string;
          available_distances: string[];
          registration_url: string | null;
          description: string | null;
          submitted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          race_name: string;
          race_date: string;
          location: string;
          distance_type: string;
          available_distances?: string[];
          registration_url?: string | null;
          description?: string | null;
          submitted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          race_name?: string;
          race_date?: string;
          location?: string;
          distance_type?: string;
          available_distances?: string[];
          registration_url?: string | null;
          description?: string | null;
          updated_at?: string;
        };
      };
      race_participants: {
        Row: {
          id: string;
          race_id: string;
          user_id: string;
          selected_distance: string | null;
          open_to_carpool: boolean;
          open_to_split_lodging: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          race_id: string;
          user_id: string;
          selected_distance?: string | null;
          open_to_carpool?: boolean;
          open_to_split_lodging?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          selected_distance?: string | null;
          open_to_carpool?: boolean;
          open_to_split_lodging?: boolean;
          notes?: string | null;
        };
      };
      workout_slots: {
        Row: {
          id: string;
          workout_date: string;
          leader_id: string | null;
          theme: string | null;
          description: string | null;
          status: string;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_date: string;
          leader_id?: string | null;
          theme?: string | null;
          description?: string | null;
          status?: string;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workout_date?: string;
          leader_id?: string | null;
          theme?: string | null;
          description?: string | null;
          status?: string;
          reminder_sent?: boolean;
          updated_at?: string;
        };
      };
      workout_interest: {
        Row: {
          id: string;
          user_id: string;
          preferred_dates: string | null;
          notes: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_dates?: string | null;
          notes?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          preferred_dates?: string | null;
          notes?: string | null;
          status?: string;
        };
      };
      workout_submissions: {
        Row: {
          id: string;
          slot_id: string;
          leader_id: string;
          workout_plan: string;
          message: string | null;
          leadership_note: string | null;
          status: string;
          submitted_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          admin_feedback: string | null;
          feedback_requested_at: string | null;
          feedback_requested_by: string | null;
          last_submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          leader_id: string;
          workout_plan: string;
          message?: string | null;
          leadership_note?: string | null;
          status?: string;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          admin_feedback?: string | null;
          feedback_requested_at?: string | null;
          feedback_requested_by?: string | null;
          last_submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workout_plan?: string;
          message?: string | null;
          leadership_note?: string | null;
          status?: string;
          submitted_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          admin_feedback?: string | null;
          feedback_requested_at?: string | null;
          feedback_requested_by?: string | null;
          last_submitted_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      core_roster: {
        Row: {
          id: string;
          full_name: string | null;
          role: string | null;
          bio: string | null;
          mission: string | null;
          instagram_handle: string | null;
          primary_photo_url: string | null;
        };
      };
      upcoming_workout: {
        Row: {
          id: string;
          workout_date: string;
          theme: string | null;
          description: string | null;
          status: string;
          leader_id: string | null;
          leader_name: string | null;
          leader_photo_url: string | null;
        };
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MemberPhoto = Database['public']['Tables']['member_photos']['Row'];
export type Race = Database['public']['Tables']['races']['Row'];
export type RaceParticipant = Database['public']['Tables']['race_participants']['Row'];
export type WorkoutSlot = Database['public']['Tables']['workout_slots']['Row'];
export type WorkoutInterest = Database['public']['Tables']['workout_interest']['Row'];
export type WorkoutSubmission = Database['public']['Tables']['workout_submissions']['Row'];
export type CoreRosterMember = Database['public']['Views']['core_roster']['Row'];
export type UpcomingWorkout = Database['public']['Views']['upcoming_workout']['Row'];

// Extended types with joins
export type RaceWithParticipants = Race & {
  submitted_by_profile: Profile | null;
  participants: (RaceParticipant & { profile: Profile })[];
};

export type ProfileWithPhotos = Profile & {
  photos: MemberPhoto[];
  primary_photo: MemberPhoto | null;
};
