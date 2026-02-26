import { useQuery } from '@tanstack/react-query';
import { supabaseRestFetch } from '@/lib/supabaseHttp';

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
        return await supabaseRestFetch<Chapter[]>('chapters?order=name.asc');
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
        const chapters = await supabaseRestFetch<Chapter[]>(`chapters?slug=eq.${slug}`);
        return chapters[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!slug,
  });
}
