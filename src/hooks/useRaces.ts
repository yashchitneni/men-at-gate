import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Race, RaceParticipant, Profile, RaceWithParticipants } from '@/types/database.types';

// Helper for direct fetch (workaround for Supabase client issue)
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
      
      // Fetch public profiles for participants (excludes sensitive data like email/phone)
      const userIds = [...new Set(participants.map(p => p.user_id))];
      const profiles = userIds.length > 0 
        ? await supabaseFetch<Profile[]>(`public_profiles?id=in.(${userIds.join(',')})`)
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
        ? await supabaseFetch<Profile[]>(`public_profiles?id=in.(${userIds.join(',')})`)
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
      userId: string;
      race_name: string;
      race_date: string;
      location: string;
      distance_type: string;
      registration_url?: string;
      description?: string;
    }) => {
      console.log('🟢 useCreateRace mutation called', { userId: race.userId, raceName: race.race_name });

      if (!race.userId) throw new Error('Must be logged in');

      console.log('🟢 Attempting to insert race...');

      const insertPromise = supabase
        .from('races')
        .insert({
          race_name: race.race_name,
          race_date: race.race_date,
          location: race.location,
          distance_type: race.distance_type,
          registration_url: race.registration_url,
          description: race.description,
          submitted_by: race.userId,
        })
        .select()
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Insert timed out after 5 seconds')), 5000)
      );

      const { data: raceData, error: raceError } = await Promise.race([insertPromise, timeoutPromise]) as any;

      console.log('🟢 Insert race result:', { data: raceData, error: raceError });
      if (raceError) throw raceError;

      console.log('🟢 Adding creator as participant...');
      // Auto-add creator as participant
      const { error: participantError } = await supabase
        .from('race_participants')
        .insert({
          race_id: raceData.id,
          user_id: race.userId,
        });

      console.log('🟢 Participant insert result:', { error: participantError });
      if (participantError) throw participantError;

      return raceData;
    },
    onSuccess: () => {
      console.log('🟢 useCreateRace success!');
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Join a race
export function useJoinRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      raceId,
      openToCarpool = false,
      openToSplitLodging = false,
      notes,
    }: {
      userId: string;
      raceId: string;
      openToCarpool?: boolean;
      openToSplitLodging?: boolean;
      notes?: string;
    }) => {
      console.log('🟢 useJoinRace mutation called', { userId, raceId, openToCarpool, openToSplitLodging, notes });

      if (!userId) throw new Error('Must be logged in');

      console.log('🟢 Attempting to insert race participant...');
      const { error } = await supabase
        .from('race_participants')
        .insert({
          race_id: raceId,
          user_id: userId,
          open_to_carpool: openToCarpool,
          open_to_split_lodging: openToSplitLodging,
          notes,
        });

      console.log('🟢 Insert result:', { error });
      if (error) throw error;
    },
    onSuccess: () => {
      console.log('🟢 useJoinRace success!');
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}

// Leave a race
export function useLeaveRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, raceId }: { userId: string; raceId: string }) => {
      if (!userId) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('race_participants')
        .delete()
        .eq('race_id', raceId)
        .eq('user_id', userId);

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
      userId,
      raceId,
      openToCarpool,
      openToSplitLodging,
      notes,
    }: {
      userId: string;
      raceId: string;
      openToCarpool?: boolean;
      openToSplitLodging?: boolean;
      notes?: string;
    }) => {
      if (!userId) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('race_participants')
        .update({
          open_to_carpool: openToCarpool,
          open_to_split_lodging: openToSplitLodging,
          notes,
        })
        .eq('race_id', raceId)
        .eq('user_id', userId);

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
