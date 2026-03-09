import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccessToken, supabaseRestFetch } from "@/lib/supabaseHttp";
import type { PublicBrotherhoodProfile, SpotlightSubmission } from "@/types/database.types";

const SPOTLIGHT_QUERY_KEY = ["spotlights"];
const BROTHERHOOD_QUERY_KEY = ["brotherhood"];

const SUBMITTED_STATUSES = new Set<SpotlightSubmission["status"]>([
  "submitted",
  "approved",
  "published",
]);

function normalizeTextArray(values: unknown, maxItems?: number) {
  if (!Array.isArray(values)) return [];

  const normalized = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return typeof maxItems === "number" ? normalized.slice(0, maxItems) : normalized;
}

function getSpotlightStoryText(profile: PublicBrotherhoodProfile) {
  return (
    profile.arena_meaning?.trim() ||
    profile.short_bio?.trim() ||
    profile.mission?.trim() ||
    profile.why_i_joined?.trim() ||
    ""
  );
}

function normalizeHandle(handle?: string | null) {
  if (!handle) return null;
  const trimmed = handle.replace("@", "").trim();
  return trimmed.length ? trimmed : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildSpotlightSlug(displayName: string, profileId: string) {
  const base = slugify(displayName || "member") || "member";
  return `${base}-${profileId.slice(0, 6)}`;
}

function chicagoDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(date);
}

function isFeaturedOnDate(profile: PublicBrotherhoodProfile, dateKey: string) {
  if (!profile.is_featured) return false;
  if (!profile.feature_start_date) return false;

  if (profile.feature_start_date > dateKey) return false;
  if (profile.feature_end_date && profile.feature_end_date < dateKey) return false;

  return true;
}

export function findActiveFeaturedProfile(profiles: PublicBrotherhoodProfile[]) {
  if (!profiles.length) return null;

  const today = chicagoDateKey();
  const scheduledFeatured = profiles.find((profile) => isFeaturedOnDate(profile, today));
  if (scheduledFeatured) return scheduledFeatured;

  return profiles.find((profile) => profile.is_featured) || null;
}

function profilePublishSortValue(profile: PublicBrotherhoodProfile) {
  const candidateDate = profile.publish_on_date || profile.published_at;
  if (!candidateDate) return 0;

  const timestamp = new Date(candidateDate).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function selectHomepageTestimonials(
  profiles: PublicBrotherhoodProfile[],
  options?: {
    excludeProfileId?: string | null;
    limit?: number;
  },
) {
  const excludeProfileId = options?.excludeProfileId || null;
  const limit = options?.limit ?? 3;

  return [...profiles]
    .filter((profile) => profile.profile_id !== excludeProfileId)
    .filter((profile) => Boolean(getSpotlightStoryText(profile)))
    .sort((a, b) => {
      const dateDiff = profilePublishSortValue(b) - profilePublishSortValue(a);
      if (dateDiff !== 0) return dateDiff;
      return a.display_name.localeCompare(b.display_name);
    })
    .slice(0, limit);
}

interface SpotlightFormPayload {
  display_name: string;
  headline?: string | null;
  short_bio: string;
  about_you_points?: string[];
  why_i_joined: string;
  mission: string;
  arena_meaning: string;
  favorite_accomplishments: string;
  favorite_quotes?: string[];
  feature_photo_urls?: string[];
  instagram_handle?: string | null;
  photo_url: string;
  consent_public_display: boolean;
}

interface SaveMySpotlightPayload {
  profileId: string;
  currentSubmission: SpotlightSubmission | null;
  form: SpotlightFormPayload;
}

async function saveSpotlightSubmission({
  profileId,
  currentSubmission,
  form,
  mode,
}: SaveMySpotlightPayload & { mode: "draft" | "submit" }) {
  const token = await getCurrentAccessToken();

  const basePayload = {
    profile_id: profileId,
    slug: buildSpotlightSlug(form.display_name, profileId),
    display_name: form.display_name.trim(),
    headline: form.headline?.trim() || null,
    about_you_points: normalizeTextArray(form.about_you_points),
    short_bio: form.short_bio.trim(),
    why_i_joined: form.why_i_joined.trim(),
    mission: form.mission.trim(),
    arena_meaning: form.arena_meaning.trim(),
    favorite_accomplishments: form.favorite_accomplishments.trim(),
    favorite_quotes: normalizeTextArray(form.favorite_quotes, 2),
    feature_photo_urls: normalizeTextArray(form.feature_photo_urls, 3),
    instagram_handle: normalizeHandle(form.instagram_handle),
    photo_url: form.photo_url,
    consent_public_display: form.consent_public_display,
    member_revision_note: mode === "submit" ? "Submitted for admin review." : null,
  };

  const shouldCreateRevision =
    !currentSubmission ||
    currentSubmission.status === "approved" ||
    currentSubmission.status === "published";

  if (mode === "submit" && !form.consent_public_display) {
    throw new Error("Public display consent is required before submitting.");
  }

  const targetStatus: SpotlightSubmission["status"] =
    mode === "submit"
      ? "submitted"
      : currentSubmission?.status === "needs_update" || currentSubmission?.status === "rejected"
        ? currentSubmission.status
        : "draft";

  if (shouldCreateRevision) {
    const inserted = await supabaseRestFetch<SpotlightSubmission[]>("spotlight_submissions", {
      method: "POST",
      token,
      body: {
        ...basePayload,
        status: targetStatus,
        supersedes_submission_id: currentSubmission?.id || null,
      },
      prefer: "return=representation",
    });

    return inserted?.[0] || null;
  }

  const updated = await supabaseRestFetch<SpotlightSubmission[]>(
    `spotlight_submissions?id=eq.${encodeURIComponent(currentSubmission.id)}`,
    {
      method: "PATCH",
      token,
      body: {
        ...basePayload,
        status: targetStatus,
      },
      prefer: "return=representation",
    },
  );

  return updated?.[0] || null;
}

export function useMySpotlightSubmission(profileId: string | null) {
  return useQuery({
    queryKey: [...SPOTLIGHT_QUERY_KEY, "mine", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const token = await getCurrentAccessToken();
      const rows = await supabaseRestFetch<SpotlightSubmission[]>(
        `spotlight_submissions?profile_id=eq.${encodeURIComponent(profileId)}&order=updated_at.desc,created_at.desc&limit=1`,
        { token },
      );

      return rows?.[0] || null;
    },
    enabled: Boolean(profileId),
  });
}

export function useSaveMySpotlightDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveMySpotlightPayload) =>
      saveSpotlightSubmission({ ...payload, mode: "draft" }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: SPOTLIGHT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["profiles", variables.profileId] });
    },
  });
}

export function useSubmitMySpotlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveMySpotlightPayload) => {
      const { form } = payload;

      if (!form.display_name.trim() || !form.short_bio.trim() || !form.why_i_joined.trim() || !form.photo_url) {
        throw new Error("Complete all required spotlight fields before submitting.");
      }
      if (!form.arena_meaning.trim()) {
        throw new Error("Add what Men in the Arena has meant for you before submitting.");
      }

      return saveSpotlightSubmission({ ...payload, mode: "submit" });
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: SPOTLIGHT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["profiles", variables.profileId] });
    },
  });
}

export function useSpotlightSubmissions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...SPOTLIGHT_QUERY_KEY, "admin", "all"],
    queryFn: async () => {
      const token = await getCurrentAccessToken();
      return supabaseRestFetch<SpotlightSubmission[]>("spotlight_submissions?order=updated_at.desc,created_at.desc", {
        token,
      });
    },
    enabled: options?.enabled ?? true,
  });
}

export function useModerateSpotlightSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      patch,
    }: {
      submissionId: string;
      patch: Partial<SpotlightSubmission>;
    }) => {
      const token = await getCurrentAccessToken();
      const rows = await supabaseRestFetch<SpotlightSubmission[]>(
        `spotlight_submissions?id=eq.${encodeURIComponent(submissionId)}`,
        {
          method: "PATCH",
          token,
          body: patch,
          prefer: "return=representation",
        },
      );

      return rows?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPOTLIGHT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BROTHERHOOD_QUERY_KEY });
    },
  });
}

export function useSetFeaturedSpotlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      featureStartDate,
      featureEndDate,
    }: {
      submissionId: string;
      featureStartDate: string;
      featureEndDate?: string | null;
    }) => {
      const token = await getCurrentAccessToken();

      await supabaseRestFetch<SpotlightSubmission[]>("spotlight_submissions?is_featured=eq.true", {
        method: "PATCH",
        token,
        body: {
          is_featured: false,
          feature_start_date: null,
          feature_end_date: null,
        },
      });

      const rows = await supabaseRestFetch<SpotlightSubmission[]>(
        `spotlight_submissions?id=eq.${encodeURIComponent(submissionId)}`,
        {
          method: "PATCH",
          token,
          body: {
            is_featured: true,
            feature_start_date: featureStartDate,
            feature_end_date: featureEndDate || null,
            status: "approved",
          },
          prefer: "return=representation",
        },
      );

      return rows?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPOTLIGHT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BROTHERHOOD_QUERY_KEY });
    },
  });
}

export function useSendSpotlightReminder() {
  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data, error } = await supabase.functions.invoke("spotlight-reminders", {
        body: {
          profile_id: profileId,
        },
      });

      if (error) throw error;
      return data as { status: string; profile_id: string; email: string };
    },
  });
}

export function useBrotherhoodDirectory() {
  return useQuery({
    queryKey: [...BROTHERHOOD_QUERY_KEY, "directory"],
    queryFn: async () => {
      return supabaseRestFetch<PublicBrotherhoodProfile[]>(
        "public_brotherhood_profiles?order=is_featured.desc,publish_on_date.desc,display_name.asc",
      );
    },
  });
}

export function useBrotherhoodProfileBySlug(slug: string) {
  return useQuery({
    queryKey: [...BROTHERHOOD_QUERY_KEY, "slug", slug],
    queryFn: async () => {
      const rows = await supabaseRestFetch<PublicBrotherhoodProfile[]>(
        `public_brotherhood_profiles?slug=eq.${encodeURIComponent(slug)}&limit=1`,
      );
      return rows?.[0] || null;
    },
    enabled: Boolean(slug),
  });
}

export function useBrotherhoodProfileByProfileId(profileId: string | null) {
  return useQuery({
    queryKey: [...BROTHERHOOD_QUERY_KEY, "legacy-id", profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const rows = await supabaseRestFetch<PublicBrotherhoodProfile[]>(
        `public_brotherhood_profiles?profile_id=eq.${encodeURIComponent(profileId)}&limit=1`,
      );

      return rows?.[0] || null;
    },
    enabled: Boolean(profileId),
  });
}

export function useHomepageSpotlightContent(options?: { testimonialLimit?: number }) {
  const testimonialLimit = options?.testimonialLimit ?? 3;
  const directory = useBrotherhoodDirectory();
  const members = directory.data || [];

  const featured = useMemo(() => findActiveFeaturedProfile(members), [members]);
  const testimonials = useMemo(() => {
    const withoutFeatured = selectHomepageTestimonials(members, {
      excludeProfileId: featured?.profile_id || null,
      limit: testimonialLimit,
    });

    if (withoutFeatured.length === 0) {
      return selectHomepageTestimonials(members, {
        excludeProfileId: null,
        limit: testimonialLimit,
      });
    }

    return withoutFeatured;
  }, [featured?.profile_id, members, testimonialLimit]);

  return {
    ...directory,
    members,
    featured,
    testimonials,
  };
}

export function isSubmissionReadyForPublish(submission: SpotlightSubmission) {
  return (
    submission.consent_public_display &&
    Boolean(submission.photo_url) &&
    Boolean(submission.display_name?.trim()) &&
    Boolean(submission.short_bio?.trim()) &&
    Boolean(submission.arena_meaning?.trim()) &&
    Boolean(submission.why_i_joined?.trim()) &&
    SUBMITTED_STATUSES.has(submission.status)
  );
}
