import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SWEATPALS_HEALTH_QUERY_KEY = ["integrations", "sweatpals", "health"];
const SWEATPALS_MAPPINGS_QUERY_KEY = ["integrations", "sweatpals", "mappings"];
const SWEATPALS_UNMAPPED_QUERY_KEY = ["integrations", "sweatpals", "unmapped"];

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
