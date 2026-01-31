import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = 'https://prursaeokvkulphtskdn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydXJzYWVva3ZrdWxwaHRza2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTYwOTIsImV4cCI6MjA4MzEzMjA5Mn0.Lqku85Nn1jKfomnrtMFpJ20z7wH70JgiMWYBN4iNP-Q';

async function supabaseFetch<T>(path: string, options?: {
  method?: string; body?: unknown; token?: string; prefer?: string;
}): Promise<T> {
  const authToken = options?.token || ANON_KEY;
  const headers: Record<string, string> = {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (options?.prefer) headers['Prefer'] = options.prefer;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Fetch failed');
  }
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

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
        return await supabaseFetch<Challenge[]>('challenges?order=start_date.desc');
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
      const [challenge] = await supabaseFetch<Challenge[]>(`challenges?id=eq.${id}`);
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
        return await supabaseFetch<ChallengeEntry[]>(
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
      const token = await getToken();
      await supabaseFetch('challenge_participants', {
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
      const token = await getToken();
      await supabaseFetch('challenge_entries', {
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
