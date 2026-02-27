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
      featured_events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          summary: string | null;
          badge_text: string | null;
          event_date_text: string | null;
          event_path: string;
          hero_cta_label: string | null;
          hero_cta_url: string;
          registration_url: string | null;
          image_url: string | null;
          hero_image_url: string | null;
          cover_image_url: string | null;
          template_key: "challenge" | "retreat";
          publish_status: "draft" | "published" | "archived";
          published_at: string | null;
          theme_json: Json;
          prefill_source_json: Json;
          is_active: boolean;
          priority: number;
          start_at: string | null;
          end_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          summary?: string | null;
          badge_text?: string | null;
          event_date_text?: string | null;
          event_path: string;
          hero_cta_label?: string | null;
          hero_cta_url: string;
          registration_url?: string | null;
          image_url?: string | null;
          hero_image_url?: string | null;
          cover_image_url?: string | null;
          template_key?: "challenge" | "retreat";
          publish_status?: "draft" | "published" | "archived";
          published_at?: string | null;
          theme_json?: Json;
          prefill_source_json?: Json;
          is_active?: boolean;
          priority?: number;
          start_at?: string | null;
          end_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          subtitle?: string | null;
          summary?: string | null;
          badge_text?: string | null;
          event_date_text?: string | null;
          event_path?: string;
          hero_cta_label?: string | null;
          hero_cta_url?: string;
          registration_url?: string | null;
          image_url?: string | null;
          hero_image_url?: string | null;
          cover_image_url?: string | null;
          template_key?: "challenge" | "retreat";
          publish_status?: "draft" | "published" | "archived";
          published_at?: string | null;
          theme_json?: Json;
          prefill_source_json?: Json;
          is_active?: boolean;
          priority?: number;
          start_at?: string | null;
          end_at?: string | null;
          updated_at?: string;
        };
      };
      featured_event_blocks: {
        Row: {
          id: string;
          featured_event_id: string;
          block_type:
            | "hero"
            | "mission"
            | "spec_grid"
            | "schedule"
            | "sponsor_cta"
            | "quote"
            | "final_cta"
            | "gallery";
          position: number;
          is_enabled: boolean;
          content_json: Json;
          image_url: string | null;
          image_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          featured_event_id: string;
          block_type:
            | "hero"
            | "mission"
            | "spec_grid"
            | "schedule"
            | "sponsor_cta"
            | "quote"
            | "final_cta"
            | "gallery";
          position: number;
          is_enabled?: boolean;
          content_json?: Json;
          image_url?: string | null;
          image_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          featured_event_id?: string;
          block_type?:
            | "hero"
            | "mission"
            | "spec_grid"
            | "schedule"
            | "sponsor_cta"
            | "quote"
            | "final_cta"
            | "gallery";
          position?: number;
          is_enabled?: boolean;
          content_json?: Json;
          image_url?: string | null;
          image_confirmed?: boolean;
          updated_at?: string;
        };
      };
      spotlight_submissions: {
        Row: {
          id: string;
          profile_id: string;
          supersedes_submission_id: string | null;
          slug: string;
          status: "draft" | "submitted" | "needs_update" | "approved" | "published" | "rejected" | "archived";
          display_name: string;
          headline: string | null;
          short_bio: string | null;
          why_i_joined: string | null;
          mission: string | null;
          instagram_handle: string | null;
          photo_url: string | null;
          consent_public_display: boolean;
          admin_notes: string | null;
          member_revision_note: string | null;
          publish_on_date: string | null;
          published_at: string | null;
          is_featured: boolean;
          feature_start_date: string | null;
          feature_end_date: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          supersedes_submission_id?: string | null;
          slug: string;
          status?: "draft" | "submitted" | "needs_update" | "approved" | "published" | "rejected" | "archived";
          display_name: string;
          headline?: string | null;
          short_bio?: string | null;
          why_i_joined?: string | null;
          mission?: string | null;
          instagram_handle?: string | null;
          photo_url?: string | null;
          consent_public_display?: boolean;
          admin_notes?: string | null;
          member_revision_note?: string | null;
          publish_on_date?: string | null;
          published_at?: string | null;
          is_featured?: boolean;
          feature_start_date?: string | null;
          feature_end_date?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          supersedes_submission_id?: string | null;
          slug?: string;
          status?: "draft" | "submitted" | "needs_update" | "approved" | "published" | "rejected" | "archived";
          display_name?: string;
          headline?: string | null;
          short_bio?: string | null;
          why_i_joined?: string | null;
          mission?: string | null;
          instagram_handle?: string | null;
          photo_url?: string | null;
          consent_public_display?: boolean;
          admin_notes?: string | null;
          member_revision_note?: string | null;
          publish_on_date?: string | null;
          published_at?: string | null;
          is_featured?: boolean;
          feature_start_date?: string | null;
          feature_end_date?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
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
      workout_guides: {
        Row: {
          id: string;
          slug: string;
          title: string;
          role_scope: string;
          version_label: string | null;
          is_active: boolean;
          content_json: Json;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          role_scope?: string;
          version_label?: string | null;
          is_active?: boolean;
          content_json?: Json;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          role_scope?: string;
          version_label?: string | null;
          is_active?: boolean;
          content_json?: Json;
          updated_by?: string | null;
          updated_at?: string;
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
          slot_id: string | null;
          assignment_id: string | null;
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
          slot_id?: string | null;
          assignment_id?: string | null;
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
          slot_id?: string | null;
          assignment_id?: string | null;
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
      workout_lead_requests: {
        Row: {
          id: string;
          schedule_event_id: string;
          user_id: string;
          notes: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_event_id: string;
          user_id: string;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          schedule_event_id?: string;
          user_id?: string;
          notes?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      workout_lead_assignments: {
        Row: {
          id: string;
          schedule_event_id: string;
          leader_id: string;
          assigned_by: string | null;
          status: string;
          day_of_reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_event_id: string;
          leader_id: string;
          assigned_by?: string | null;
          status?: string;
          day_of_reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          schedule_event_id?: string;
          leader_id?: string;
          assigned_by?: string | null;
          status?: string;
          day_of_reminder_sent_at?: string | null;
          updated_at?: string;
        };
      };
      sweatpals_schedule_events: {
        Row: {
          id: string;
          provider: string;
          community_username: string;
          community_id: string;
          external_event_id: string;
          alias: string | null;
          title: string;
          event_type: string | null;
          starts_at: string;
          ends_at: string | null;
          timezone: string | null;
          location: string | null;
          image_url: string | null;
          event_url: string | null;
          checkout_url: string | null;
          is_workout: boolean;
          payload_json: Json;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          community_username: string;
          community_id: string;
          external_event_id: string;
          alias?: string | null;
          title: string;
          event_type?: string | null;
          starts_at: string;
          ends_at?: string | null;
          timezone?: string | null;
          location?: string | null;
          image_url?: string | null;
          event_url?: string | null;
          checkout_url?: string | null;
          is_workout?: boolean;
          payload_json?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          community_username?: string;
          community_id?: string;
          external_event_id?: string;
          alias?: string | null;
          title?: string;
          event_type?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          timezone?: string | null;
          location?: string | null;
          image_url?: string | null;
          event_url?: string | null;
          checkout_url?: string | null;
          is_workout?: boolean;
          payload_json?: Json;
          synced_at?: string;
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
      upcoming_leadable_workouts: {
        Row: {
          schedule_event_id: string;
          external_event_id: string;
          event_alias: string | null;
          title: string;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          event_url: string | null;
          is_assigned: boolean;
          assignment_id: string | null;
          assigned_leader_id: string | null;
          assigned_leader_name: string | null;
          pending_requests: number;
        };
      };
      public_brotherhood_profiles: {
        Row: {
          spotlight_submission_id: string;
          profile_id: string;
          slug: string;
          display_name: string;
          headline: string | null;
          short_bio: string | null;
          why_i_joined: string | null;
          mission: string | null;
          instagram_handle: string | null;
          photo_url: string | null;
          publish_on_date: string | null;
          published_at: string | null;
          is_featured: boolean;
          feature_start_date: string | null;
          feature_end_date: string | null;
          profile_role: string | null;
        };
      };
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MemberPhoto = Database['public']['Tables']['member_photos']['Row'];
export type Race = Database['public']['Tables']['races']['Row'];
export type FeaturedEvent = Database['public']['Tables']['featured_events']['Row'];
export type FeaturedEventBlock = Database['public']['Tables']['featured_event_blocks']['Row'];
export type RaceParticipant = Database['public']['Tables']['race_participants']['Row'];
export type WorkoutSlot = Database['public']['Tables']['workout_slots']['Row'];
export type WorkoutInterest = Database['public']['Tables']['workout_interest']['Row'];
export type WorkoutGuide = Database['public']['Tables']['workout_guides']['Row'];
export type WorkoutSubmission = Database['public']['Tables']['workout_submissions']['Row'];
export type WorkoutLeadRequest = Database['public']['Tables']['workout_lead_requests']['Row'];
export type WorkoutLeadAssignment = Database['public']['Tables']['workout_lead_assignments']['Row'];
export type SweatpalsScheduleEvent = Database['public']['Tables']['sweatpals_schedule_events']['Row'];
export type SpotlightSubmission = Database['public']['Tables']['spotlight_submissions']['Row'];
export type CoreRosterMember = Database['public']['Views']['core_roster']['Row'];
export type UpcomingWorkout = Database['public']['Views']['upcoming_workout']['Row'];
export type UpcomingLeadableWorkout = Database['public']['Views']['upcoming_leadable_workouts']['Row'];
export type PublicBrotherhoodProfile = Database['public']['Views']['public_brotherhood_profiles']['Row'];

// Extended types with joins
export type RaceWithParticipants = Race & {
  submitted_by_profile: Profile | null;
  participants: (RaceParticipant & { profile: Profile })[];
};

export type ProfileWithPhotos = Profile & {
  photos: MemberPhoto[];
  primary_photo: MemberPhoto | null;
};
