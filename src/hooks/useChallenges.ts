import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentAccessToken, supabaseRestFetch } from '@/lib/supabaseHttp';

export interface Challenge {
  id: string;
  name: string;
  description: string | null;
  challenge_type: string;
  start_date: string;
  end_date: string;
  metric: string | null;
  target_value: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  user_id: string;
  entry_date: string;
  value: number;
  notes: string | null;
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async (): Promise<Challenge[]> => {
      try {
        return await supabaseRestFetch<Challenge[]>('challenges?order=start_date.desc');
      } catch {
        return [];
      }
    },
  });
}

export function useChallenge(id: string) {
  return useQuery({
    queryKey: ['challenges', id],
    queryFn: async () => {
      const [challenge] = await supabaseRestFetch<Challenge[]>(`challenges?id=eq.${id}`);
      return challenge || null;
    },
    enabled: !!id,
  });
}

export function useChallengeEntries(challengeId: string) {
  return useQuery({
    queryKey: ['challenge-entries', challengeId],
    queryFn: async (): Promise<ChallengeEntry[]> => {
      try {
        return await supabaseRestFetch<ChallengeEntry[]>(
          `challenge_entries?challenge_id=eq.${challengeId}&order=entry_date.desc`
        );
      } catch {
        return [];
      }
    },
    enabled: !!challengeId,
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      const token = await getCurrentAccessToken();
      await supabaseRestFetch('challenge_participants', {
        method: 'POST',
        body: { challenge_id: challengeId, user_id: userId },
        token,
        prefer: 'return=minimal',
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });
}

export function useLogEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      challengeId: string; userId: string; value: number; notes?: string; date?: string;
    }) => {
      const token = await getCurrentAccessToken();
      await supabaseRestFetch('challenge_entries', {
        method: 'POST',
        body: {
          challenge_id: entry.challengeId,
          user_id: entry.userId,
          value: entry.value,
          notes: entry.notes || null,
          entry_date: entry.date || new Date().toISOString().split('T')[0],
        },
        token,
        prefer: 'return=minimal',
      });
    },
    onSuccess: (_, v) => queryClient.invalidateQueries({ queryKey: ['challenge-entries', v.challengeId] }),
  });
}
