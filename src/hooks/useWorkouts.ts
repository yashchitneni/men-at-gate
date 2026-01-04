import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WorkoutSlot, WorkoutInterest, Profile } from '@/types/database.types';

// Extended types
type WorkoutSlotWithLeader = WorkoutSlot & {
  leader: Profile | null;
};

type WorkoutInterestWithProfile = WorkoutInterest & {
  profile: Profile;
};

// Helper for direct fetch
async function supabaseFetch<T>(path: string): Promise<T> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
      
      // Fetch leader separately if exists
      const slot = data[0];
      let leader = null;
      if (slot.leader_id) {
        const leaders = await supabaseFetch<Profile[]>(
          `profiles?id=eq.${slot.leader_id}`
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
      
      // Fetch all profiles to join
      const profiles = await supabaseFetch<Profile[]>('profiles?select=*');
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('workout_interest')
        .insert({
          user_id: user.id,
          preferred_dates: preferredDates,
          notes,
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
