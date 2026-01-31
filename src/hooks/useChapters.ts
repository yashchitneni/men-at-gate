import { useQuery } from '@tanstack/react-query';

const SUPABASE_URL = 'https://prursaeokvkulphtskdn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydXJzYWVva3ZrdWxwaHRza2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NTYwOTIsImV4cCI6MjA4MzEzMjA5Mn0.Lqku85Nn1jKfomnrtMFpJ20z7wH70JgiMWYBN4iNP-Q';

async function supabaseFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Fetch failed');
  return response.json();
}

export interface Chapter {
  id: string;
  name: string;
  city: string;
  state: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  description: string | null;
  founded_date: string | null;
  created_at: string;
}

export function useChapters() {
  return useQuery({
    queryKey: ['chapters'],
    queryFn: async (): Promise<Chapter[]> => {
      try {
        return await supabaseFetch<Chapter[]>('chapters?order=name.asc');
      } catch {
        return [];
      }
    },
  });
}

export function useChapter(slug: string) {
  return useQuery({
    queryKey: ['chapters', slug],
    queryFn: async (): Promise<Chapter | null> => {
      try {
        const chapters = await supabaseFetch<Chapter[]>(`chapters?slug=eq.${slug}`);
        return chapters[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!slug,
  });
}
