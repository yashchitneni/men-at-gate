import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SWEATPALS_HEALTH_QUERY_KEY = ["integrations", "sweatpals", "health"];
const SWEATPALS_MAPPINGS_QUERY_KEY = ["integrations", "sweatpals", "mappings"];
const SWEATPALS_UNMAPPED_QUERY_KEY = ["integrations", "sweatpals", "unmapped"];
const SWEATPALS_NEXT_WORKOUT_QUERY_KEY = ["integrations", "sweatpals", "next-workout"];
const SWEATPALS_SCHEDULE_QUERY_KEY = ["integrations", "sweatpals", "public-schedule"];
const SWEATPALS_IDENTITY_STATUS_QUERY_KEY = ["integrations", "sweatpals", "identity-status"];
const SWEATPALS_FUNCTION_TIMEOUT_MS = 15_000;

async function invokeSweatpalsFunction<T>(body: Record<string, unknown>): Promise<T> {
  const result = await Promise.race([
    supabase.functions.invoke("sweatpals-sync", { body }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("SweatPals request timed out. Please try again.")), SWEATPALS_FUNCTION_TIMEOUT_MS);
    }),
  ]) as { data: T | null; error: Error | null };

  if (result.error) throw result.error;
  return result.data as T;
}

export interface SweatpalsRunSummary {
  id: string;
  action: string;
  status: string;
  triggered_by: string;
  event_count: number;
  inserted_external_events: number;
  inserted_attendance_facts: number;
  identity_updates: number;
  unmapped_events: number;
  error_count: number;
  created_at: string;
}

export interface SweatpalsHealthResponse {
  status: "ok" | "degraded" | "unavailable";
  provider: "sweatpals";
  last_synced_at: string | null;
  last_webhook_at: string | null;
  last_webhook_status: string | null;
  external_events_count: number;
  attendance_facts_count: number;
  event_rollups_count: number;
  member_rollups_count: number;
  schedule_events_count: number;
  schedule_workouts_count: number;
  schedule_last_synced_at: string | null;
  ingested_last_24h: number;
  unmapped_external_events: number;
  errors_last_24h: number;
  recent_runs: SweatpalsRunSummary[];
}

export interface SweatpalsIngestResponse {
  status: "ok" | "dry_run";
  inserted_external_events: number;
  inserted_attendance_facts: number;
  identity_updates: number;
  refreshed_rollups: boolean;
  unmapped_external_events: number;
  unmapped_event_ids: string[];
}

export interface SweatpalsMappingRow {
  id: string;
  provider: string;
  external_event_id: string;
  external_event_name: string | null;
  featured_event_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  featured_event: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface SweatpalsUnmappedEvent {
  external_event_id: string;
  occurrence_count: number;
  latest_occurred_at: string;
  event_types: string[];
  sample_event_name: string | null;
}

export interface SaveMappingResponse {
  status: "ok";
  mapping: SweatpalsMappingRow;
  linked_external_events: number;
  linked_attendance_facts: number;
}

export interface SweatpalsNextWorkout {
  external_event_id: string;
  featured_event_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  event_alias: string | null;
  destination_path: string | null;
  destination_url: string | null;
}

export interface SweatpalsScheduleItem {
  external_event_id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  image_url: string | null;
  event_url: string | null;
  checkout_url: string | null;
  event_alias: string | null;
  event_type: string | null;
  is_workout: boolean;
}

export interface SweatpalsScheduleSyncResponse {
  status: "ok" | "dry_run";
  fetched: number;
  upserted: number;
  workouts: number;
  from: string;
  community_username: string;
  community_id: string;
}

export interface SweatpalsIdentityStatusResponse {
  status: "ok";
  provider: "sweatpals" | string;
  linked: boolean;
  linked_identities: number;
  matchable_unlinked_identities: number;
  last_seen_external_at: string | null;
}

export interface SweatpalsClaimIdentityResponse {
  status: "ok";
  provider: "sweatpals" | string;
  linked_identities: number;
  linked_external_events: number;
  linked_attendance_facts: number;
  rollups_refreshed: boolean;
}

export function useSweatpalsHealth() {
  return useQuery({
    queryKey: SWEATPALS_HEALTH_QUERY_KEY,
    queryFn: async (): Promise<SweatpalsHealthResponse> => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: { action: "health" },
      });

      if (error) {
        return {
          status: "unavailable",
          provider: "sweatpals",
          last_synced_at: null,
          last_webhook_at: null,
          last_webhook_status: null,
          external_events_count: 0,
          attendance_facts_count: 0,
          event_rollups_count: 0,
          member_rollups_count: 0,
          schedule_events_count: 0,
          schedule_workouts_count: 0,
          schedule_last_synced_at: null,
          ingested_last_24h: 0,
          unmapped_external_events: 0,
          errors_last_24h: 1,
          recent_runs: [],
        };
      }

      return data as SweatpalsHealthResponse;
    },
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useRunSweatpalsTestIngest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: { dry_run?: boolean; persist?: boolean; events?: unknown[] }) => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: {
          action: "test_ingest",
          dry_run: payload?.dry_run,
          persist: payload?.persist,
          events: payload?.events,
        },
      });

      if (error) throw error;
      return data as SweatpalsIngestResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWEATPALS_HEALTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_UNMAPPED_QUERY_KEY });
    },
  });
}

export function useReplaySweatpalsRollups() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: { action: "replay" },
      });

      if (error) throw error;
      return data as { status: "ok"; refreshed_rollups: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWEATPALS_HEALTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_UNMAPPED_QUERY_KEY });
    },
  });
}

export function useSweatpalsMappings() {
  return useQuery({
    queryKey: SWEATPALS_MAPPINGS_QUERY_KEY,
    queryFn: async (): Promise<SweatpalsMappingRow[]> => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: { action: "list_mappings" },
      });

      if (error) throw error;
      return ((data as { items?: SweatpalsMappingRow[] })?.items || []) as SweatpalsMappingRow[];
    },
  });
}

export function useSweatpalsUnmappedEvents(limit = 25) {
  return useQuery({
    queryKey: [...SWEATPALS_UNMAPPED_QUERY_KEY, limit],
    queryFn: async (): Promise<SweatpalsUnmappedEvent[]> => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: {
          action: "list_unmapped",
          limit,
        },
      });

      if (error) throw error;
      return ((data as { items?: SweatpalsUnmappedEvent[] })?.items || []) as SweatpalsUnmappedEvent[];
    },
    refetchInterval: 60_000,
  });
}

export function useSweatpalsNextWorkout() {
  return useQuery({
    queryKey: SWEATPALS_NEXT_WORKOUT_QUERY_KEY,
    queryFn: async (): Promise<SweatpalsNextWorkout | null> => {
      const data = await invokeSweatpalsFunction<{ item?: SweatpalsNextWorkout | null }>({
        action: "public_next_workout",
      });

      return (data?.item ?? null) as SweatpalsNextWorkout | null;
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSweatpalsSchedule(options?: {
  workoutsOnly?: boolean;
  limit?: number;
  from?: string;
  communityUsername?: string;
}) {
  const workoutsOnly = options?.workoutsOnly ?? false;
  const limit = options?.limit ?? 30;
  const from = options?.from;
  const communityUsername = options?.communityUsername;

  return useQuery({
    queryKey: [...SWEATPALS_SCHEDULE_QUERY_KEY, workoutsOnly, limit, from ?? null, communityUsername ?? null],
    queryFn: async (): Promise<SweatpalsScheduleItem[]> => {
      const data = await invokeSweatpalsFunction<{ items?: SweatpalsScheduleItem[] }>({
        action: "public_schedule",
        workouts_only: workoutsOnly,
        limit,
        from,
        community_username: communityUsername,
      });

      return ((data as { items?: SweatpalsScheduleItem[] })?.items || []) as SweatpalsScheduleItem[];
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSyncSweatpalsSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload?: {
      community_username?: string;
      period_from?: string;
      limit?: number;
      dry_run?: boolean;
      api_base?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: {
          action: "sync_schedule",
          community_username: payload?.community_username,
          period_from: payload?.period_from,
          limit: payload?.limit,
          dry_run: payload?.dry_run,
          api_base: payload?.api_base,
        },
      });

      if (error) throw error;
      return data as SweatpalsScheduleSyncResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWEATPALS_HEALTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_NEXT_WORKOUT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_SCHEDULE_QUERY_KEY });
    },
  });
}

export function useSweatpalsIdentityStatus(enabled = true) {
  return useQuery({
    queryKey: SWEATPALS_IDENTITY_STATUS_QUERY_KEY,
    enabled,
    queryFn: async (): Promise<SweatpalsIdentityStatusResponse> => {
      const data = await invokeSweatpalsFunction<SweatpalsIdentityStatusResponse>({
        action: "identity_status",
      });
      return data;
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useClaimSweatpalsIdentity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<SweatpalsClaimIdentityResponse> => {
      const data = await invokeSweatpalsFunction<SweatpalsClaimIdentityResponse>({
        action: "claim_identity",
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWEATPALS_IDENTITY_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_HEALTH_QUERY_KEY });
    },
  });
}

export function useSaveSweatpalsMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      external_event_id: string;
      featured_event_id: string;
      external_event_name?: string | null;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("sweatpals-sync", {
        body: {
          action: "save_mapping",
          external_event_id: payload.external_event_id,
          featured_event_id: payload.featured_event_id,
          external_event_name: payload.external_event_name,
          is_active: payload.is_active ?? true,
        },
      });

      if (error) throw error;
      return data as SaveMappingResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SWEATPALS_HEALTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_UNMAPPED_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SWEATPALS_MAPPINGS_QUERY_KEY });
    },
  });
}
