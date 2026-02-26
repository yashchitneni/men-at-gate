import { useQuery } from "@tanstack/react-query";
import { supabaseRestFetch } from "@/lib/supabaseHttp";

export interface CommunityActivitySummary {
  attendees_7d: number;
  racers_month: number;
  workouts_led_30d: number;
  workouts_attended_30d: number;
}

export interface AttendanceLeaderboardEntry {
  id: string;
  full_name: string | null;
  attendance_count: number;
  workout_attendance_count: number;
  event_checkins_count: number;
}

export interface WorkoutLeaderEntry {
  id: string;
  full_name: string | null;
  workouts_led: number;
}

function toDateOnly(value: Date): string {
  return value.toISOString().split("T")[0];
}

async function fetchCommunitySummaryFallback(): Promise<CommunityActivitySummary> {
  const now = new Date();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgoDate = toDateOnly(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [eventAttendanceRows, workoutLeads, workoutAttendanceRows, monthRaces] =
    await Promise.all([
      supabaseRestFetch<{ id: string }[]>(
        `event_attendance_facts?select=id&status=in.(claimed,checked_in)&status_at=gte.${sevenDaysAgoIso}`,
      ).catch(() => []),
      supabaseRestFetch<{ id: string }[]>(
        `workout_slots?select=id&leader_id=not.is.null&workout_date=gte.${thirtyDaysAgoDate}`,
      ).catch(() => []),
      supabaseRestFetch<{ id: string }[]>(
        `workout_attendance?select=id&created_at=gte.${thirtyDaysAgoIso}`,
      ).catch(() => []),
      supabaseRestFetch<{ id: string }[]>(
        `races?select=id&race_date=gte.${toDateOnly(monthStart)}&race_date=lte.${toDateOnly(monthEnd)}`,
      ).catch(() => []),
    ]);

  let racersMonth = 0;
  if (monthRaces.length > 0) {
    const raceIds = monthRaces.map((race) => race.id).join(",");
    const participants = await supabaseRestFetch<{ id: string }[]>(
      `race_participants?select=id&race_id=in.(${raceIds})`,
    ).catch(() => []);
    racersMonth = participants.length;
  }

  return {
    attendees_7d: eventAttendanceRows.length,
    racers_month: racersMonth,
    workouts_led_30d: workoutLeads.length,
    workouts_attended_30d: workoutAttendanceRows.length,
  };
}

export function useCommunityActivitySummary() {
  return useQuery({
    queryKey: ["community", "summary"],
    queryFn: async (): Promise<CommunityActivitySummary> => {
      const [summary] = await supabaseRestFetch<CommunityActivitySummary[]>(
        "community_activity_summary?select=*",
      ).catch(() => []);

      if (summary) return summary;
      return fetchCommunitySummaryFallback();
    },
  });
}

export function useAttendanceLeaderboard(limit = 5) {
  return useQuery({
    queryKey: ["community", "attendance-leaderboard", limit],
    queryFn: async (): Promise<AttendanceLeaderboardEntry[]> => {
      const fromView = await supabaseRestFetch<AttendanceLeaderboardEntry[]>(
        `leaderboard_attendance_30d?order=attendance_count.desc&limit=${limit}`,
      ).catch(() => []);

      if (fromView.length > 0) return fromView;

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const attendance = await supabaseRestFetch<{ user_id: string }[]>(
        `workout_attendance?select=user_id&created_at=gte.${since}`,
      ).catch(() => []);

      if (!attendance.length) return [];

      const totals = new Map<string, number>();
      for (const row of attendance) {
        totals.set(row.user_id, (totals.get(row.user_id) || 0) + 1);
      }

      const userIds = [...totals.keys()];
      const profiles = await supabaseRestFetch<{ id: string; full_name: string | null }[]>(
        `public_profiles?select=id,full_name&id=in.(${userIds.join(",")})`,
      ).catch(() => []);

      return profiles
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name,
          attendance_count: totals.get(profile.id) || 0,
          workout_attendance_count: totals.get(profile.id) || 0,
          event_checkins_count: 0,
        }))
        .sort((a, b) => b.attendance_count - a.attendance_count)
        .slice(0, limit);
    },
  });
}

export function useWorkoutLeaderLeaderboard(limit = 5) {
  return useQuery({
    queryKey: ["community", "workout-leaders", limit],
    queryFn: async (): Promise<WorkoutLeaderEntry[]> => {
      const fromView = await supabaseRestFetch<WorkoutLeaderEntry[]>(
        `leaderboard_workout_leaders_90d?order=workouts_led.desc&limit=${limit}`,
      ).catch(() => []);

      if (fromView.length > 0) return fromView;

      const sinceDate = toDateOnly(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      const slots = await supabaseRestFetch<{ leader_id: string }[]>(
        `workout_slots?select=leader_id&leader_id=not.is.null&workout_date=gte.${sinceDate}`,
      ).catch(() => []);

      if (!slots.length) return [];

      const totals = new Map<string, number>();
      for (const slot of slots) {
        totals.set(slot.leader_id, (totals.get(slot.leader_id) || 0) + 1);
      }

      const leaderIds = [...totals.keys()];
      const profiles = await supabaseRestFetch<{ id: string; full_name: string | null }[]>(
        `public_profiles?select=id,full_name&id=in.(${leaderIds.join(",")})`,
      ).catch(() => []);

      return profiles
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name,
          workouts_led: totals.get(profile.id) || 0,
        }))
        .sort((a, b) => b.workouts_led - a.workouts_led)
        .slice(0, limit);
    },
  });
}
