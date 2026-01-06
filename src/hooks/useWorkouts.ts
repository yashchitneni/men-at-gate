import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkoutSlot, WorkoutInterest, WorkoutSubmission, Profile } from '@/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Extended types
type WorkoutSlotWithLeader = WorkoutSlot & {
  leader: Profile | null;
};

type WorkoutInterestWithProfile = WorkoutInterest & {
  profile: Profile;
};

// Helper for direct fetch
async function supabaseFetch<T>(path: string): Promise<T> {
  const url = `https://prursaeokvkulphtskdn.supabase.co/rest/v1/${path}`;
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydXJzYWVva3ZrdWxwaHRza2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTYwOTIsImV4cCI6MjA4MzEzMjA5Mn0.Lqku85Nn1jKfomnrtMFpJ20z7wH70JgiMWYBN4iNP-Q';
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Fetch failed');
  }
  return response.json();
}

// Fetch upcoming workout (next one)
export function useUpcomingWorkout() {
  return useQuery({
    queryKey: ['workouts', 'upcoming'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const data = await supabaseFetch<WorkoutSlot[]>(
        `workout_slots?select=*&workout_date=gte.${today}&order=workout_date.asc&limit=1`
      );
      
      if (!data || data.length === 0) return null;
      
      // Fetch leader separately if exists (using public view)
      const slot = data[0];
      let leader = null;
      if (slot.leader_id) {
        const leaders = await supabaseFetch<Profile[]>(
          `public_profiles?id=eq.${slot.leader_id}`
        );
        leader = leaders[0] || null;
      }
      
      return { ...slot, leader } as WorkoutSlotWithLeader;
    },
  });
}

// Fetch all workout slots (for admin)
export function useWorkoutSlots() {
  return useQuery({
    queryKey: ['workouts', 'slots'],
    queryFn: async () => {
      const slots = await supabaseFetch<WorkoutSlot[]>(
        'workout_slots?select=*&order=workout_date.asc'
      );
      
      // Fetch all public profiles to join (excludes sensitive data)
      const profiles = await supabaseFetch<Profile[]>('public_profiles?select=*');
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      return slots.map(slot => ({
        ...slot,
        leader: slot.leader_id ? profileMap.get(slot.leader_id) || null : null,
      })) as WorkoutSlotWithLeader[];
    },
  });
}

// Fetch workout interest list (for admin)
export function useWorkoutInterest() {
  return useQuery({
    queryKey: ['workouts', 'interest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_interest')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as WorkoutInterestWithProfile[];
    },
  });
}

// Check if current user has expressed interest
export function useMyWorkoutInterest() {
  return useQuery({
    queryKey: ['workouts', 'my-interest'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('workout_interest')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutInterest | null;
    },
  });
}

// Express interest in leading a workout
export function useExpressInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preferredDates,
      notes,
    }: {
      preferredDates?: string;
      notes?: string;
    }) => {
      console.log('🔵 useExpressInterest mutation called', { preferredDates, notes });

      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔵 Got user:', { hasUser: !!user, userId: user?.id });

      if (!user) throw new Error('Must be logged in');

      console.log('🔵 Attempting to insert workout interest...');
      const { data, error } = await supabase
        .from('workout_interest')
        .insert({
          user_id: user.id,
          preferred_dates: preferredDates,
          notes,
        })
        .select()
        .single();

      console.log('🔵 Insert result:', { data, error });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log('🔵 useExpressInterest success!');
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Cancel interest
export function useCancelInterest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interestId: string) => {
      const { error } = await supabase
        .from('workout_interest')
        .delete()
        .eq('id', interestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Create a workout slot
export function useCreateWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workoutDate,
      leaderId,
      theme,
      description,
    }: {
      workoutDate: string;
      leaderId?: string;
      theme?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('workout_slots')
        .insert({
          workout_date: workoutDate,
          leader_id: leaderId,
          theme,
          description,
          status: leaderId ? 'assigned' : 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Assign a leader to a workout slot
export function useAssignLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      leaderId,
    }: {
      slotId: string;
      leaderId: string;
    }) => {
      const { error } = await supabase
        .from('workout_slots')
        .update({
          leader_id: leaderId,
          status: 'assigned',
        })
        .eq('id', slotId);

      if (error) throw error;

      // Update the interest status
      await supabase
        .from('workout_interest')
        .update({ status: 'assigned' })
        .eq('user_id', leaderId)
        .eq('status', 'pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Update workout slot
export function useUpdateWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      theme,
      description,
      status,
    }: {
      slotId: string;
      theme?: string;
      description?: string;
      status?: string;
    }) => {
      const { error } = await supabase
        .from('workout_slots')
        .update({
          theme,
          description,
          status,
        })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Delete workout slot
export function useDeleteWorkoutSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('workout_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Extended type for submissions with slot info
type WorkoutSubmissionWithSlot = WorkoutSubmission & {
  slot: WorkoutSlot | null;
};

// Fetch submission for a specific slot
export function useWorkoutSubmission(slotId: string) {
  return useQuery({
    queryKey: ['workouts', 'submission', slotId],
    queryFn: async () => {
      const { data, error } = await db
        .from('workout_submissions')
        .select('*')
        .eq('slot_id', slotId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutSubmission | null;
    },
    enabled: !!slotId,
  });
}

// Fetch my submission for a slot (as leader)
export function useMyWorkoutSubmission(slotId: string) {
  return useQuery({
    queryKey: ['workouts', 'my-submission', slotId],
    queryFn: async () => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) return null;

      const { data, error } = await db
        .from('workout_submissions')
        .select('*')
        .eq('slot_id', slotId)
        .eq('leader_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as WorkoutSubmission | null;
    },
    enabled: !!slotId,
  });
}

// Fetch all submissions (for admin)
export function useAllWorkoutSubmissions() {
  return useQuery({
    queryKey: ['workouts', 'submissions'],
    queryFn: async () => {
      const { data, error } = await db
        .from('workout_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WorkoutSubmission[];
    },
  });
}

// Create or update submission
export function useSaveWorkoutSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      workoutPlan,
      message,
      leadershipNote,
      status = 'draft',
    }: {
      slotId: string;
      workoutPlan: string;
      message?: string;
      leadershipNote?: string;
      status?: 'draft' | 'submitted';
    }) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      // Check if submission exists
      const { data: existing } = await db
        .from('workout_submissions')
        .select('id')
        .eq('slot_id', slotId)
        .single();

      if (existing) {
        // Update
        const { data, error } = await db
          .from('workout_submissions')
          .update({
            workout_plan: workoutPlan,
            message,
            leadership_note: leadershipNote,
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await db
          .from('workout_submissions')
          .insert({
            slot_id: slotId,
            leader_id: user.id,
            workout_plan: workoutPlan,
            message,
            leadership_note: leadershipNote,
            status,
            submitted_at: status === 'submitted' ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

// Admin: Approve submission
export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await db
        .from('workout_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
