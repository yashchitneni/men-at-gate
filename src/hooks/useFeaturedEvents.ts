import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeaturedEvent } from "@/types/database.types";

const FEATURED_EVENTS_QUERY_KEY = ["featured-events"];

function isEventActiveNow(event: FeaturedEvent, now = new Date()): boolean {
  const startAt = event.start_at ? new Date(event.start_at) : null;
  const endAt = event.end_at ? new Date(event.end_at) : null;

  const startsOnOrBeforeNow = !startAt || startAt <= now;
  const endsOnOrAfterNow = !endAt || endAt >= now;

  return event.is_active && startsOnOrBeforeNow && endsOnOrAfterNow;
}

function normalizeOptionalValue(value?: string | null) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: FEATURED_EVENTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_events")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FeaturedEvent[];
    },
  });
}

export function useActiveFeaturedEvent() {
  const featuredEventsQuery = useFeaturedEvents();

  return {
    ...featuredEventsQuery,
    data: featuredEventsQuery.data?.find((event) => isEventActiveNow(event)) ?? null,
  };
}

export function useFeaturedEventBySlug(slug: string) {
  return useQuery({
    queryKey: [...FEATURED_EVENTS_QUERY_KEY, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return (data as FeaturedEvent | null) ?? null;
    },
    enabled: Boolean(slug),
  });
}

type FeaturedEventUpsertInput = Partial<FeaturedEvent> & {
  slug: string;
  title: string;
  event_path: string;
  hero_cta_url: string;
};

export function useSaveFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FeaturedEventUpsertInput) => {
      const normalizedPayload = {
        ...payload,
        slug: payload.slug.trim(),
        title: payload.title.trim(),
        subtitle: normalizeOptionalValue(payload.subtitle),
        summary: normalizeOptionalValue(payload.summary),
        badge_text: normalizeOptionalValue(payload.badge_text),
        event_date_text: normalizeOptionalValue(payload.event_date_text),
        hero_cta_label: normalizeOptionalValue(payload.hero_cta_label),
        registration_url: normalizeOptionalValue(payload.registration_url),
        image_url: normalizeOptionalValue(payload.image_url),
        start_at: normalizeOptionalValue(payload.start_at),
        end_at: normalizeOptionalValue(payload.end_at),
        event_path: payload.event_path.trim(),
        hero_cta_url: payload.hero_cta_url.trim(),
      };

      const { data, error } = await supabase
        .from("featured_events")
        .upsert(normalizedPayload, { onConflict: "id" })
        .select("*")
        .single();

      if (error) throw error;

      const savedEvent = data as FeaturedEvent;

      if (savedEvent.is_active) {
        const { error: deactivateError } = await supabase
          .from("featured_events")
          .update({ is_active: false })
          .neq("id", savedEvent.id);

        if (deactivateError) throw deactivateError;
      }

      return savedEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENTS_QUERY_KEY });
    },
  });
}

export function useDeleteFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("featured_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENTS_QUERY_KEY });
    },
  });
}
