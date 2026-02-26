import { useQuery } from '@tanstack/react-query';
import { supabaseRestFetch } from '@/lib/supabaseHttp';

export interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  total_points: number;
  activities_count: number;
}

export interface PointsLogEntry {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria_type: string;
  criteria_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

type TimeFilter = 'week' | 'month' | 'all';

export function useLeaderboard(timeFilter: TimeFilter = 'all') {
  return useQuery({
    queryKey: ['leaderboard', timeFilter],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      try {
        if (timeFilter === 'all') {
          // Use the view directly
          return await supabaseRestFetch<LeaderboardEntry[]>(
            'leaderboard?order=total_points.desc&limit=50'
          );
        }

        // For time-filtered, compute from points_log
        const now = new Date();
        const start = new Date();
        if (timeFilter === 'week') start.setDate(now.getDate() - 7);
        else if (timeFilter === 'month') start.setMonth(now.getMonth() - 1);

        const logs = await supabaseRestFetch<PointsLogEntry[]>(
          `points_log?created_at=gte.${start.toISOString()}&select=user_id,points`
        );

        // Aggregate by user
        const userMap = new Map<string, number>();
        for (const log of logs) {
          userMap.set(log.user_id, (userMap.get(log.user_id) || 0) + log.points);
        }

        // Get profiles for these users
        const userIds = [...userMap.keys()];
        if (!userIds.length) return [];

        const profiles = await supabaseRestFetch<{ id: string; full_name: string | null }[]>(
          `public_profiles?id=in.(${userIds.join(',')})&select=id,full_name`
        );

        return profiles
          .map(p => ({
            id: p.id,
            full_name: p.full_name,
            total_points: userMap.get(p.id) || 0,
            activities_count: logs.filter(l => l.user_id === p.id).length,
          }))
          .sort((a, b) => b.total_points - a.total_points);
      } catch {
        // If tables don't exist yet, return empty
        return [];
      }
    },
  });
}

export function useUserPoints(userId: string) {
  return useQuery({
    queryKey: ['points', userId],
    queryFn: async (): Promise<PointsLogEntry[]> => {
      try {
        return await supabaseRestFetch<PointsLogEntry[]>(
          `points_log?user_id=eq.${userId}&order=created_at.desc`
        );
      } catch {
        return [];
      }
    },
    enabled: !!userId,
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['badges', userId],
    queryFn: async (): Promise<UserBadge[]> => {
      try {
        return await supabaseRestFetch<UserBadge[]>(
          `user_badges?user_id=eq.${userId}&select=*,badge:badges(*)`
        );
      } catch {
        return [];
      }
    },
    enabled: !!userId,
  });
}

export const POINT_VALUES = {
  lead_workout: 50,
  attend_workout: 20,
  race_completed: 30,
  podium: 50,
} as const;

export const REASON_LABELS: Record<string, string> = {
  lead_workout: 'Led Workout',
  attend_workout: 'Attended Workout',
  race_completed: 'Race Completed',
  podium: 'Podium Finish',
};
