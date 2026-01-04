import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Race, RaceParticipant, Profile, RaceWithParticipants } from '@/types/database.types';

// Helper for direct fetch (workaround for Supabase client issue)
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

// Fetch all upcoming races with participants
export function useRaces() {
  return useQuery({
    queryKey: ['races'],
    queryFn: async (): Promise<RaceWithParticipants[]> => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch races
      const races = await supabaseFetch<Race[]>(
        `races?select=*&race_date=gte.${today}&order=race_date.asc`
      );
      
      if (!races.length) return [];
      
      // Fetch all participants for these races
      const raceIds = races.map(r => r.id);
      const participants = await supabaseFetch<RaceParticipant[]>(
        `race_participants?race_id=in.(${raceIds.join(',')})`
      );
      
      // Fetch profiles for participants
      const userIds = [...new Set(participants.map(p => p.user_id))];
      const profiles = userIds.length > 0 
        ? await supabaseFetch<Profile[]>(`profiles?id=in.(${userIds.join(',')})`)
        : [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      // Combine data
      return races.map(race => ({
        ...race,
        participants: participants
          .filter(p => p.race_id === race.id)
          .map(p => ({ ...p, profile: profileMap.get(p.user_id) || null })),
      })) as RaceWithParticipants[];
    },
  });
}

// Fetch single race
export function useRace(raceId: string) {
  return useQuery({
    queryKey: ['races', raceId],
    queryFn: async (): Promise<RaceWithParticipants> => {
      const races = await supabaseFetch<Race[]>(`races?id=eq.${raceId}`);
      if (!races.length) throw new Error('Race not found');
      const race = races[0];
      
      const participants = await supabaseFetch<RaceParticipant[]>(
        `race_participants?race_id=eq.${raceId}`
      );
      
      const userIds = participants.map(p => p.user_id);
      const profiles = userIds.length > 0
        ? await supabaseFetch<Profile[]>(`profiles?id=in.(${userIds.join(',')})`)
        : [];
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      return {
        ...race,
        participants: participants.map(p => ({ ...p, profile: profileMap.get(p.user_id) || null })),
      } as RaceWithParticipants;
    },
    enabled: !!raceId,
  });
}

// Create a new race
export function useCreateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (race: {
      race_name: string;
      race_date: string;
      location: string;
      distance_type: string;
      registration_url?: string;
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      // Create the race
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .insert({
          ...race,
          submitted_by: user.id,
        })
        .select()
        .single();

      if (raceError) throw raceError;

      // Auto-add creator as participant
      const { error: participantError } = await supabase
        .from('race_participants')
        .insert({
          race_id: raceData.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      return raceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Join a race
export function useJoinRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      raceId,
      openToCarpool = false,
      openToSplitLodging = false,
      notes,
    }: {
      raceId: string;
      openToCarpool?: boolean;
      openToSplitLodging?: boolean;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('race_participants')
        .insert({
          race_id: raceId,
          user_id: user.id,
          open_to_carpool: openToCarpool,
          open_to_split_lodging: openToSplitLodging,
          notes,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Leave a race
export function useLeaveRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('race_participants')
        .delete()
        .eq('race_id', raceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Update participation preferences
export function useUpdateParticipation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      raceId,
      openToCarpool,
      openToSplitLodging,
      notes,
    }: {
      raceId: string;
      openToCarpool?: boolean;
      openToSplitLodging?: boolean;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('race_participants')
        .update({
          open_to_carpool: openToCarpool,
          open_to_split_lodging: openToSplitLodging,
          notes,
        })
        .eq('race_id', raceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Delete a race (only by creator)
export function useDeleteRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: string) => {
      const { error } = await supabase
        .from('races')
        .delete()
        .eq('id', raceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
