import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeaturedEvent, FeaturedEventBlock } from "@/types/database.types";
import {
  buildEventPath,
  buildTemplateBlocks,
  normalizeSlug,
  type FeaturedEventBlockDraft,
  type FeaturedEventTemplateKey,
} from "@/lib/featuredEventTemplates";

const FEATURED_EVENTS_QUERY_KEY = ["featured-events"];
const FEATURED_EVENT_BLOCKS_QUERY_KEY = ["featured-event-blocks"];

function isEventActiveNow(event: FeaturedEvent, now = new Date()): boolean {
  const startAt = event.start_at ? new Date(event.start_at) : null;
  const endAt = event.end_at ? new Date(event.end_at) : null;

  const startsOnOrBeforeNow = !startAt || startAt <= now;
  const endsOnOrAfterNow = !endAt || endAt >= now;

  return event.publish_status === "published" && event.is_active && startsOnOrBeforeNow && endsOnOrAfterNow;
}

function normalizeOptionalValue(value?: string | null) {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizeBlockPayload(blocks: FeaturedEventBlockDraft[]) {
  return blocks.map((block, index) => ({
    id: block.id,
    block_type: block.block_type,
    position: index,
    is_enabled: block.is_enabled,
    content_json: block.content_json,
    image_url: normalizeOptionalValue(block.image_url),
    image_confirmed: block.image_confirmed,
  }));
}

function toEventDateText(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const parsed = new Date(startsAt);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function useFeaturedEvents(options?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: [...FEATURED_EVENTS_QUERY_KEY, options?.publishedOnly ? "published" : "all"],
    queryFn: async () => {
      let query = supabase
        .from("featured_events")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (options?.publishedOnly) {
        query = query.eq("publish_status", "published");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeaturedEvent[];
    },
  });
}

export function useActiveFeaturedEvent() {
  const featuredEventsQuery = useFeaturedEvents({ publishedOnly: true });

  return {
    ...featuredEventsQuery,
    data: featuredEventsQuery.data?.find((event) => isEventActiveNow(event)) ?? null,
  };
}

export function useFeaturedEventBySlug(slug: string, options?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: [...FEATURED_EVENTS_QUERY_KEY, slug, options?.publishedOnly ? "published" : "all"],
    queryFn: async () => {
      let query = supabase
        .from("featured_events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (options?.publishedOnly) {
        query = query.eq("publish_status", "published");
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as FeaturedEvent | null) ?? null;
    },
    enabled: Boolean(slug),
  });
}

export function useFeaturedEventBlocks(featuredEventId: string | null, options?: { publishedOnly?: boolean }) {
  return useQuery({
    queryKey: [
      ...FEATURED_EVENT_BLOCKS_QUERY_KEY,
      featuredEventId,
      options?.publishedOnly ? "published" : "all",
    ],
    queryFn: async () => {
      if (!featuredEventId) return [];

      let query = supabase
        .from("featured_event_blocks")
        .select("*")
        .eq("featured_event_id", featuredEventId)
        .order("position", { ascending: true });

      if (options?.publishedOnly) {
        query = query.eq("is_enabled", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []) as FeaturedEventBlock[];
    },
    enabled: Boolean(featuredEventId),
  });
}

type FeaturedEventUpsertInput = Partial<FeaturedEvent> & {
  slug: string;
  title: string;
  event_path: string;
  hero_cta_url: string;
  template_key: FeaturedEventTemplateKey;
  publish_status: FeaturedEvent["publish_status"];
};

export function useSaveFeaturedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FeaturedEventUpsertInput) => {
      const normalizedPayload = {
        ...payload,
        slug: normalizeSlug(payload.slug),
        title: payload.title.trim(),
        subtitle: normalizeOptionalValue(payload.subtitle),
        summary: normalizeOptionalValue(payload.summary),
        badge_text: normalizeOptionalValue(payload.badge_text),
        event_date_text: normalizeOptionalValue(payload.event_date_text),
        hero_cta_label: normalizeOptionalValue(payload.hero_cta_label),
        registration_url: normalizeOptionalValue(payload.registration_url),
        image_url: normalizeOptionalValue(payload.image_url),
        hero_image_url: normalizeOptionalValue(payload.hero_image_url),
        cover_image_url: normalizeOptionalValue(payload.cover_image_url),
        start_at: normalizeOptionalValue(payload.start_at),
        end_at: normalizeOptionalValue(payload.end_at),
        event_path: payload.event_path.trim() || buildEventPath(payload.slug),
        hero_cta_url: payload.hero_cta_url.trim(),
        template_key: payload.template_key,
        publish_status: payload.publish_status,
        published_at:
          payload.publish_status === "published"
            ? payload.published_at || new Date().toISOString()
            : payload.publish_status === "archived"
              ? payload.published_at || null
              : null,
        is_active: payload.publish_status === "published" ? Boolean(payload.is_active) : false,
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
          .neq("id", savedEvent.id)
          .eq("publish_status", "published");

        if (deactivateError) throw deactivateError;
      }

      return savedEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENTS_QUERY_KEY });
    },
  });
}

export function useReplaceFeaturedEventBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { featuredEventId: string; blocks: FeaturedEventBlockDraft[] }) => {
      const { featuredEventId, blocks } = payload;

      const { error: deleteError } = await supabase
        .from("featured_event_blocks")
        .delete()
        .eq("featured_event_id", featuredEventId);

      if (deleteError) throw deleteError;

      if (!blocks.length) return [] as FeaturedEventBlock[];

      const insertPayload = normalizeBlockPayload(blocks).map((block) => ({
        ...block,
        featured_event_id: featuredEventId,
      }));

      const { data, error } = await supabase
        .from("featured_event_blocks")
        .insert(insertPayload)
        .select("*");

      if (error) throw error;
      return (data ?? []) as FeaturedEventBlock[];
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...FEATURED_EVENT_BLOCKS_QUERY_KEY, variables.featuredEventId],
      });
    },
  });
}

export function usePromoteScheduleEventToFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      scheduleEvent: {
        external_event_id: string;
        title: string;
        starts_at: string;
        location: string | null;
        image_url: string | null;
        event_url: string | null;
      };
      templateKey: FeaturedEventTemplateKey;
      slug: string;
      title?: string;
      prefillFromSchedule?: boolean;
    }) => {
      const slug = normalizeSlug(payload.slug);
      const title = payload.title?.trim() || payload.scheduleEvent.title;
      const registrationUrl = payload.scheduleEvent.event_url || "";
      const prefillEnabled = payload.prefillFromSchedule ?? true;

      const insertEvent = {
        slug,
        title,
        subtitle: null,
        summary: null,
        badge_text: "Featured Event",
        event_date_text: toEventDateText(payload.scheduleEvent.starts_at),
        event_path: buildEventPath(slug),
        hero_cta_label: "View Event",
        hero_cta_url: buildEventPath(slug),
        registration_url: registrationUrl || null,
        image_url: prefillEnabled ? payload.scheduleEvent.image_url : null,
        hero_image_url: prefillEnabled ? payload.scheduleEvent.image_url : null,
        cover_image_url: prefillEnabled ? payload.scheduleEvent.image_url : null,
        template_key: payload.templateKey,
        publish_status: "draft" as const,
        prefill_source_json: {
          provider: "sweatpals",
          external_event_id: payload.scheduleEvent.external_event_id,
          promoted_at: new Date().toISOString(),
        },
        is_active: false,
        priority: 0,
      };

      const { data: featuredEventData, error: featuredEventError } = await supabase
        .from("featured_events")
        .insert(insertEvent)
        .select("*")
        .single();

      if (featuredEventError) throw featuredEventError;

      const featuredEvent = featuredEventData as FeaturedEvent;
      const blocks = buildTemplateBlocks(payload.templateKey, {
        title: featuredEvent.title,
        subtitle: featuredEvent.subtitle,
        summary: featuredEvent.summary,
        badgeText: featuredEvent.badge_text,
        dateText: featuredEvent.event_date_text,
        registrationUrl: featuredEvent.registration_url,
        heroImageUrl: featuredEvent.hero_image_url,
        location: payload.scheduleEvent.location,
      });

      const insertBlocks = normalizeBlockPayload(blocks).map((block) => ({
        ...block,
        featured_event_id: featuredEvent.id,
      }));

      const { error: blocksError } = await supabase
        .from("featured_event_blocks")
        .insert(insertBlocks);

      if (blocksError) throw blocksError;

      return featuredEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENT_BLOCKS_QUERY_KEY });
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
      queryClient.invalidateQueries({ queryKey: FEATURED_EVENT_BLOCKS_QUERY_KEY });
    },
  });
}
