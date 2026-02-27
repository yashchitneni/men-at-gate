import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

type AuthMode = "sync_secret" | "admin_jwt";
type AttendanceStatus = "ticketed" | "claimed" | "checked_in" | "waitlisted" | "cancelled";

interface RawEvent {
  [key: string]: unknown;
}

interface NormalizedExternalEvent {
  provider: string;
  external_event_id: string;
  event_type: string;
  external_member_id: string | null;
  member_id: string | null;
  event_id: string | null;
  occurred_at: string;
  dedupe_key: string;
  payload_json: Record<string, unknown>;
  email: string | null;
  phone: string | null;
  display_name: string | null;
}

interface ExternalIdentityRow {
  provider: string;
  external_member_id: string;
  email?: string;
  phone?: string;
  display_name?: string;
  profile_id?: string;
  auto_linked?: boolean;
  linked_at?: string;
  last_seen_at: string;
}

interface IngestionResult {
  status: "ok" | "dry_run";
  inserted_external_events: number;
  inserted_attendance_facts: number;
  identity_updates: number;
  refreshed_rollups: boolean;
  unmapped_external_events: number;
  unmapped_event_ids: string[];
}

interface AuthResultOk {
  ok: true;
  mode: AuthMode;
}

interface AuthResultFail {
  ok: false;
  status: number;
  error: string;
}

interface IngestionRunInput {
  provider: string;
  action: string;
  status: string;
  triggered_by: string;
  event_count?: number;
  inserted_external_events?: number;
  inserted_attendance_facts?: number;
  identity_updates?: number;
  unmapped_events?: number;
  error_count?: number;
  errors?: unknown[];
  result_payload?: unknown;
}

interface SweatpalsPublicUser {
  id?: string;
  userName?: string;
  [key: string]: unknown;
}

interface SweatpalsPublicEvent {
  [key: string]: unknown;
}

interface ScheduleSyncResult {
  status: "ok" | "dry_run";
  fetched: number;
  upserted: number;
  workouts: number;
  from: string;
  community_username: string;
  community_id: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const DEFAULT_SWEATPALS_API_BASE = "https://ilove.sweatpals.com/api";
const DEFAULT_SCHEDULE_LIMIT = 100;
const MAX_SCHEDULE_LIMIT = 200;
const DEFAULT_AUTO_SYNC_MINUTES = 120;

const WEBHOOK_ALLOWED_ACTIONS = new Set(["health", "ingest", "sync_schedule"]);
const PUBLIC_READ_ACTIONS = new Set([
  "public_schedule",
  "public_next_workout",
]);
const ADMIN_ONLY_ACTIONS = new Set([
  "test_ingest",
  "replay",
  "list_unmapped",
  "list_mappings",
  "save_mapping",
  "cleanup_errors",
]);

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function isUuid(value: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function normalizeEventType(value: string | null): string {
  if (!value) return "ticketed";
  const normalized = value.trim().toLowerCase();

  if (
    normalized.includes("check") ||
    normalized.includes("used") ||
    normalized === "new_check_in" ||
    normalized === "new_checkin"
  ) {
    return "checked_in";
  }

  if (normalized.includes("claim")) return "claimed";
  if (normalized.includes("waitlist")) return "waitlisted";
  if (normalized.includes("member") && normalized.includes("renew")) return "member_renewed";
  if (normalized.includes("member") && normalized.includes("cancel")) return "member_cancelled";
  if (normalized.includes("member") && normalized.includes("new")) return "member_new";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("ticket")) return "ticketed";

  return normalized.replace(/\s+/g, "_");
}

function getAttendanceStatus(eventType: string): AttendanceStatus | null {
  if (eventType === "checked_in") return "checked_in";
  if (eventType === "claimed") return "claimed";
  if (eventType === "waitlisted") return "waitlisted";
  if (eventType === "cancelled") return "cancelled";
  if (eventType === "ticketed") return "ticketed";
  return null;
}

function parseOccurredAt(value: string | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function getPayloadValue(rawEvent: RawEvent, key: string): unknown {
  if (key in rawEvent) return rawEvent[key];
  const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  if (snakeKey in rawEvent) return rawEvent[snakeKey];
  return null;
}

function normalizeIncomingEvent(rawEvent: RawEvent): NormalizedExternalEvent {
  const provider = pickString(rawEvent.provider, "sweatpals") || "sweatpals";

  const rawEventType =
    pickString(
      rawEvent.event_type,
      rawEvent.eventType,
      rawEvent.trigger,
      rawEvent.trigger_event,
      rawEvent.type,
      rawEvent.name,
    ) || "ticketed";
  const eventType = normalizeEventType(rawEventType);

  const externalEventId =
    pickString(
      rawEvent.external_event_id,
      rawEvent.event_id,
      rawEvent.eventId,
      getPayloadValue(rawEvent, "event_id"),
      (rawEvent.event as { id?: string } | undefined)?.id,
    ) || (eventType.startsWith("member_") ? "membership" : "unknown-event");

  const externalMemberId =
    pickString(
      rawEvent.external_member_id,
      rawEvent.user_id,
      rawEvent.userId,
      rawEvent.member_id,
      rawEvent.memberId,
      rawEvent.profile_id,
      (rawEvent.user as { id?: string } | undefined)?.id,
      (rawEvent.member as { id?: string } | undefined)?.id,
      getPayloadValue(rawEvent, "user_id"),
      getPayloadValue(rawEvent, "member_id"),
    ) || null;

  const email =
    pickString(
      rawEvent.email,
      rawEvent.user_email,
      rawEvent.member_email,
      (rawEvent.user as { email?: string } | undefined)?.email,
      (rawEvent.member as { email?: string } | undefined)?.email,
      getPayloadValue(rawEvent, "email"),
    ) || null;

  const phone =
    pickString(
      rawEvent.phone,
      rawEvent.user_phone,
      rawEvent.member_phone,
      (rawEvent.user as { phone?: string } | undefined)?.phone,
      (rawEvent.member as { phone?: string } | undefined)?.phone,
      getPayloadValue(rawEvent, "phone"),
    ) || null;

  const displayName =
    pickString(
      rawEvent.display_name,
      rawEvent.full_name,
      rawEvent.name,
      rawEvent.user_name,
      (rawEvent.user as { name?: string } | undefined)?.name,
      (rawEvent.member as { name?: string } | undefined)?.name,
    ) || null;

  const occurredAt = parseOccurredAt(
    pickString(
      rawEvent.occurred_at,
      rawEvent.occurredAt,
      rawEvent.created_at,
      rawEvent.createdAt,
      rawEvent.timestamp,
      getPayloadValue(rawEvent, "occurred_at"),
      getPayloadValue(rawEvent, "created_at"),
    ),
  );

  const dedupeKey =
    pickString(
      rawEvent.dedupe_key,
      rawEvent.id,
      rawEvent.event_log_id,
      rawEvent.log_id,
      getPayloadValue(rawEvent, "dedupe_key"),
    ) || `${eventType}:${externalEventId}:${externalMemberId ?? "unknown-member"}:${occurredAt}`;

  const memberId = isUuid(externalMemberId) ? externalMemberId : null;

  return {
    provider,
    external_event_id: externalEventId,
    event_type: eventType,
    external_member_id: externalMemberId,
    member_id: memberId,
    event_id: null,
    occurred_at: occurredAt,
    dedupe_key: dedupeKey,
    payload_json: rawEvent,
    email,
    phone,
    display_name: displayName,
  };
}

function extractEventName(payload: Record<string, unknown>): string | null {
  return pickString(
    payload.event_name,
    payload.name,
    payload.title,
    (payload.event as { name?: string; title?: string } | undefined)?.name,
    (payload.event as { name?: string; title?: string } | undefined)?.title,
  );
}

function parseEventDate(value: string | null): string | null {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsedShortDate = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(parsedShortDate.getTime()) ? null : parsedShortDate.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function isWorkoutLikeEvent(name: string | null, alias: string | null): boolean {
  const combined = `${name || ""} ${alias || ""}`.toLowerCase();
  return (
    combined.includes("workout") ||
    combined.includes("mta") ||
    combined.includes("men-in-the-arena") ||
    combined.includes("men in the arena")
  );
}

function clampLimit(value: unknown, defaultValue: number, maxValue: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return defaultValue;
  const rounded = Math.floor(numeric);
  return Math.min(Math.max(rounded, 1), maxValue);
}

function clampAutoSyncMinutes(value: unknown): number {
  return clampLimit(value, DEFAULT_AUTO_SYNC_MINUTES, 24 * 60);
}

function toEventPageUrl(...values: unknown[]): string | null {
  const raw = pickString(...values);
  if (!raw) return null;
  return raw.replace(/\/checkout\/?(?=$|\?)/i, "");
}

function getSweatpalsApiBase(rawValue: unknown): string {
  const value = pickString(rawValue, Deno.env.get("SWEATPALS_API_BASE"), DEFAULT_SWEATPALS_API_BASE) || DEFAULT_SWEATPALS_API_BASE;
  return value.replace(/\/+$/, "");
}

function mapEventRouteSegment(eventType: string | null): string {
  const normalized = (eventType || "").toLowerCase();
  if (normalized === "class") return "class";
  if (normalized === "retreat") return "retreat";
  if (normalized === "challenge") return "challenge";
  return "event";
}

function buildSweatpalsEventUrls(
  alias: string | null,
  eventType: string | null,
  shortLocalInstance: string | null,
): { event_url: string | null; checkout_url: string | null } {
  if (!alias) {
    return { event_url: null, checkout_url: null };
  }

  const routeSegment = mapEventRouteSegment(eventType);
  const basePath = shortLocalInstance
    ? `/${routeSegment}/${alias}/${shortLocalInstance}`
    : `/${routeSegment}/${alias}`;
  const siteBase = "https://www.sweatpals.com";

  return {
    event_url: `${siteBase}${basePath}`,
    checkout_url: `${siteBase}${basePath}/checkout`,
  };
}

function buildSweatpalsFileUrl(apiBase: string, fileId: string, variant: string | null): string {
  const encodedFileId = encodeURIComponent(fileId);
  const variantValue = variant || "l";
  return `${apiBase}/files/${encodedFileId}?variant=${encodeURIComponent(variantValue)}`;
}

async function fetchJsonFromSweatpals<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const bodyText = await response.text();
  if (!response.ok) {
    const trimmedBody = bodyText.length > 300 ? `${bodyText.slice(0, 300)}...` : bodyText;
    throw new Error(`SweatPals API request failed (${response.status}): ${trimmedBody || response.statusText}`);
  }

  if (!bodyText) return {} as T;

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new Error(`SweatPals API returned invalid JSON for: ${url}`);
  }
}

function normalizeScheduleEventRow(
  event: SweatpalsPublicEvent,
  communityUsername: string,
  communityId: string,
  apiBase: string,
): Record<string, unknown> | null {
  const externalEventId = pickString(
    event.baseId,
    event.base_id,
    event.external_event_id,
    event.id,
  );
  const title = pickString(event.name, event.title, event.event_name);
  const alias = pickString(event.alias, event.event_alias, event.eventAlias);
  const eventType = pickString(event.eventType, event.event_type, event.type) || "EVENT";

  const startsAt = parseEventDate(
    pickString(
      event.instance,
      event.instanceStartDate,
      event.startDate,
      event.start_date,
      event.event_full_date,
      event.event_date,
    ),
  );

  if (!externalEventId || !title || !startsAt) {
    return null;
  }

  const endsAt = parseEventDate(
    pickString(
      event.instanceEndDate,
      event.endDate,
      event.end_date,
      event.event_full_end_date,
    ),
  );

  const shortLocalInstance = pickString(event.shortLocalInstance, event.event_short_date);
  const defaultUrls = buildSweatpalsEventUrls(alias, eventType, shortLocalInstance);

  const onlineUrl = pickString(event.onlineUrl, event.online_url);
  const eventUrl = toEventPageUrl(event.deepLink, event.event_url, defaultUrls.event_url, onlineUrl);
  const checkoutUrl = pickString(event.checkout_url, defaultUrls.checkout_url);
  const avatar = (typeof event.avatar === "object" && event.avatar !== null)
    ? (event.avatar as Record<string, unknown>)
    : null;
  const avatarId = pickString(
    event.avatarId,
    event.avatar_id,
    avatar?.id,
  );
  const avatarVariant = pickString(
    event.avatarVariant,
    event.avatar_variant,
    avatar?.variant,
    "l",
  );
  const derivedAvatarUrl = avatarId ? buildSweatpalsFileUrl(apiBase, avatarId, avatarVariant) : null;

  return {
    provider: "sweatpals",
    community_username: communityUsername,
    community_id: communityId,
    external_event_id: externalEventId,
    alias,
    title,
    event_type: eventType,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: pickString(event.tzid, event.timezone),
    location: pickString(event.addressName, event.address_name, event.location),
    image_url: pickString(
      event.image_url,
      event.imageUrl,
      event.coverImageUrl,
      event.cover_image_url,
      event.bannerImageUrl,
      event.banner_image_url,
      event.avatar_url,
      event.avatarUrl,
      derivedAvatarUrl,
    ),
    event_url: eventUrl,
    checkout_url: checkoutUrl,
    is_workout: isWorkoutLikeEvent(title, alias),
    payload_json: event,
    synced_at: new Date().toISOString(),
  };
}

async function syncSweatpalsSchedule(
  supabase: SupabaseClient,
  input: {
    communityUsername: string;
    periodFrom: string;
    limit: number;
    dryRun: boolean;
    apiBase: string;
  },
): Promise<ScheduleSyncResult> {
  const profileUrl =
    `${input.apiBase}/users/username/${encodeURIComponent(input.communityUsername)}` +
    "?withEventsCount=true&withFriendsAndFollowersCount=true&withFriendsAndFollowersList=false";

  const communityProfile = await fetchJsonFromSweatpals<SweatpalsPublicUser>(profileUrl);
  const communityId = pickString(communityProfile.id);
  if (!communityId) {
    throw new Error("Unable to resolve SweatPals community profile id.");
  }

  const events = await fetchJsonFromSweatpals<SweatpalsPublicEvent[]>(
    `${input.apiBase}/events/public/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorsIds: [communityId],
        periodFrom: input.periodFrom,
        limit: input.limit,
        withUnverifiedEvents: true,
      }),
    },
  );

  const rowsByKey = new Map<string, Record<string, unknown>>();
  let workoutCount = 0;

  for (const event of events ?? []) {
    const row = normalizeScheduleEventRow(event, input.communityUsername, communityId, input.apiBase);
    if (!row) continue;

    if (row.is_workout === true) workoutCount += 1;

    const key = `${row.provider}:${row.external_event_id}:${row.starts_at}`;
    if (!rowsByKey.has(key)) {
      rowsByKey.set(key, row);
      continue;
    }

    const existing = rowsByKey.get(key);
    const existingCheckoutUrl = pickString(existing?.checkout_url);
    const incomingCheckoutUrl = pickString(row.checkout_url);
    if (!existingCheckoutUrl && incomingCheckoutUrl) {
      rowsByKey.set(key, row);
    }
  }

  const rows = [...rowsByKey.values()];

  if (input.dryRun) {
    return {
      status: "dry_run",
      fetched: rows.length,
      upserted: rows.length,
      workouts: workoutCount,
      from: input.periodFrom,
      community_username: input.communityUsername,
      community_id: communityId,
    };
  }

  const upsertResult = await supabase
    .from("sweatpals_schedule_events")
    .upsert(rows, { onConflict: "provider,external_event_id,starts_at" })
    .select("id");

  if (upsertResult.error) throw upsertResult.error;

  return {
    status: "ok",
    fetched: rows.length,
    upserted: upsertResult.data?.length ?? 0,
    workouts: workoutCount,
    from: input.periodFrom,
    community_username: input.communityUsername,
    community_id: communityId,
  };
}

async function maybeAutoSyncSchedule(
  supabase: SupabaseClient,
  input: {
    communityUsername: string;
    periodFrom: string;
    apiBase: string;
    autoSyncMinutes: number;
    sourceAction: string;
  },
): Promise<void> {
  const latestSyncResult = await supabase
    .from("sweatpals_schedule_events")
    .select("synced_at, updated_at")
    .eq("provider", "sweatpals")
    .eq("community_username", input.communityUsername)
    .order("synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSyncResult.error) {
    console.error("Failed to check schedule freshness", latestSyncResult.error.message);
  } else {
    const latestSyncAt = pickString(
      latestSyncResult.data?.synced_at,
      latestSyncResult.data?.updated_at,
    );
    if (latestSyncAt) {
      const latest = new Date(latestSyncAt).getTime();
      const cutoff = Date.now() - input.autoSyncMinutes * 60 * 1000;
      if (!Number.isNaN(latest) && latest > cutoff) {
        return;
      }
    }
  }

  try {
    const result = await syncSweatpalsSchedule(supabase, {
      communityUsername: input.communityUsername,
      periodFrom: input.periodFrom,
      limit: DEFAULT_SCHEDULE_LIMIT,
      dryRun: false,
      apiBase: input.apiBase,
    });

    await writeIngestionRun(supabase, {
      provider: "sweatpals",
      action: "sync_schedule",
      status: "ok",
      triggered_by: "public_auto_sync",
      event_count: result.fetched,
      inserted_external_events: result.upserted,
      result_payload: {
        source_action: input.sourceAction,
        ...result,
      },
    });
  } catch (error) {
    console.error("Auto schedule sync failed", error instanceof Error ? error.message : error);
    await writeIngestionRun(supabase, {
      provider: "sweatpals",
      action: "sync_schedule",
      status: "error",
      triggered_by: "public_auto_sync",
      error_count: 1,
      errors: [error instanceof Error ? error.message : "Unexpected auto sync error"],
      result_payload: { source_action: input.sourceAction },
    });
  }
}

async function resolveAuth(
  req: Request,
  supabase: AnySupabaseClient,
): Promise<AuthResultOk | AuthResultFail> {
  const syncSecret = Deno.env.get("SWEATPALS_SYNC_SECRET");
  const providedSyncSecret = req.headers.get("x-sync-secret");

  if (syncSecret && providedSyncSecret === syncSecret) {
    return { ok: true, mode: "sync_secret" };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }

  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) {
    return { ok: false, status: 401, error: "Invalid bearer token" };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !authData?.user?.id) {
    return { ok: false, status: 401, error: "Unauthorized user" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin, is_super_admin")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, status: 500, error: "Failed to verify admin access" };
  }

  if (!profile?.is_admin && !profile?.is_super_admin) {
    return { ok: false, status: 403, error: "Admin access required" };
  }

  return { ok: true, mode: "admin_jwt" };
}

async function writeIngestionRun(
  supabase: AnySupabaseClient,
  run: IngestionRunInput,
): Promise<void> {
  const payload = {
    provider: run.provider,
    action: run.action,
    status: run.status,
    triggered_by: run.triggered_by,
    event_count: run.event_count ?? 0,
    inserted_external_events: run.inserted_external_events ?? 0,
    inserted_attendance_facts: run.inserted_attendance_facts ?? 0,
    identity_updates: run.identity_updates ?? 0,
    unmapped_events: run.unmapped_events ?? 0,
    error_count: run.error_count ?? 0,
    errors: run.errors ?? [],
    result_payload: run.result_payload ?? {},
  };

  const { error } = await supabase.from("integration_ingestion_runs").insert(payload);
  if (error) {
    console.error("Failed to persist ingestion run", error.message);
  }
}

async function loadEventMappings(
  supabase: AnySupabaseClient,
  provider: string,
  externalEventIds: string[],
): Promise<Map<string, string>> {
  const mappingByKey = new Map<string, string>();
  if (!externalEventIds.length) return mappingByKey;

  const { data, error } = await supabase
    .from("external_event_mappings")
    .select("provider, external_event_id, featured_event_id, is_active")
    .eq("provider", provider)
    .eq("is_active", true)
    .in("external_event_id", externalEventIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const mappedProvider = pickString(row.provider);
    const mappedExternalEventId = pickString(row.external_event_id);
    const mappedFeaturedEventId = pickString(row.featured_event_id);
    if (!mappedProvider || !mappedExternalEventId || !mappedFeaturedEventId) continue;
    mappingByKey.set(`${mappedProvider}:${mappedExternalEventId}`, mappedFeaturedEventId);
  }

  return mappingByKey;
}

async function loadExistingIdentities(
  supabase: AnySupabaseClient,
  provider: string,
  externalMemberIds: string[],
): Promise<Map<string, { profile_id: string | null; linked_at: string | null }>> {
  const identities = new Map<string, { profile_id: string | null; linked_at: string | null }>();
  if (!externalMemberIds.length) return identities;

  const { data, error } = await supabase
    .from("external_member_identities")
    .select("provider, external_member_id, profile_id, linked_at")
    .eq("provider", provider)
    .in("external_member_id", externalMemberIds);

  if (error) throw error;

  for (const row of data ?? []) {
    const mappedProvider = pickString(row.provider);
    const mappedExternalMemberId = pickString(row.external_member_id);
    if (!mappedProvider || !mappedExternalMemberId) continue;

    identities.set(`${mappedProvider}:${mappedExternalMemberId}`, {
      profile_id: pickString(row.profile_id),
      linked_at: pickString(row.linked_at),
    });
  }

  return identities;
}

async function findProfilesByEmail(
  supabase: AnySupabaseClient,
  emails: string[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  if (!emails.length) return results;

  await Promise.all(
    emails.map(async (email) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email)
        .limit(1)
        .maybeSingle();

      if (error || !data) return;
      const profileId = pickString(data.id);
      const profileEmail = pickString(data.email);
      if (!profileId || !profileEmail) return;
      results.set(profileEmail.toLowerCase(), profileId);
    }),
  );

  return results;
}

function mergeIdentityRows(rows: ExternalIdentityRow[]): ExternalIdentityRow[] {
  const byKey = new Map<string, ExternalIdentityRow>();

  for (const row of rows) {
    const key = `${row.provider}:${row.external_member_id}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, row);
      continue;
    }

    byKey.set(key, {
      ...existing,
      email: row.email || existing.email,
      phone: row.phone || existing.phone,
      display_name: row.display_name || existing.display_name,
      profile_id: row.profile_id || existing.profile_id,
      auto_linked: Boolean(existing.auto_linked || row.auto_linked),
      linked_at: row.linked_at || existing.linked_at,
      last_seen_at: row.last_seen_at > existing.last_seen_at ? row.last_seen_at : existing.last_seen_at,
    });
  }

  return [...byKey.values()];
}

async function ingestEvents(
  supabase: AnySupabaseClient,
  rawEvents: RawEvent[],
  dryRun: boolean,
): Promise<IngestionResult> {
  const normalizedEvents = rawEvents.map(normalizeIncomingEvent);

  const provider = normalizedEvents[0]?.provider || "sweatpals";
  const externalEventIds = [...new Set(normalizedEvents.map((event) => event.external_event_id))];
  const externalMemberIds = [
    ...new Set(normalizedEvents.map((event) => event.external_member_id).filter((value): value is string => Boolean(value))),
  ];
  const emails = [
    ...new Set(normalizedEvents.map((event) => event.email?.toLowerCase() || "").filter((value) => value.length > 0)),
  ];

  const [mappingByKey, identityByKey, profileByEmail] = await Promise.all([
    loadEventMappings(supabase, provider, externalEventIds),
    loadExistingIdentities(supabase, provider, externalMemberIds),
    findProfilesByEmail(supabase, emails),
  ]);

  const unmappedExternalEventIds = new Set<string>();
  const externalRows: Array<Record<string, unknown>> = [];
  const attendanceRows: Array<Record<string, unknown>> = [];
  const identityRows: ExternalIdentityRow[] = [];
  const nowIso = new Date().toISOString();

  for (const event of normalizedEvents) {
    const mappingKey = `${event.provider}:${event.external_event_id}`;
    const mappedEventId = mappingByKey.get(mappingKey) || null;
    const identityKey = event.external_member_id ? `${event.provider}:${event.external_member_id}` : null;
    const existingIdentity = identityKey ? identityByKey.get(identityKey) : null;
    const emailProfileId = event.email ? profileByEmail.get(event.email.toLowerCase()) || null : null;

    const resolvedMemberId =
      event.member_id ||
      existingIdentity?.profile_id ||
      emailProfileId ||
      null;

    if (!mappedEventId && !event.event_type.startsWith("member_")) {
      unmappedExternalEventIds.add(event.external_event_id);
    }

    externalRows.push({
      provider: event.provider,
      external_event_id: event.external_event_id,
      event_type: event.event_type,
      external_member_id: event.external_member_id,
      member_id: resolvedMemberId,
      event_id: mappedEventId,
      occurred_at: event.occurred_at,
      dedupe_key: event.dedupe_key,
      payload_json: event.payload_json,
      sync_error: null,
    });

    const attendanceStatus = getAttendanceStatus(event.event_type);
    if (attendanceStatus) {
      attendanceRows.push({
        provider: event.provider,
        external_event_id: event.external_event_id,
        external_member_id: event.external_member_id,
        member_id: resolvedMemberId,
        event_id: mappedEventId,
        status: attendanceStatus,
        status_at: event.occurred_at,
        source: "sweatpals",
        dedupe_key: `attendance:${event.dedupe_key}`,
        raw_external_event_id: null,
      });
    }

    if (event.external_member_id) {
      const identityRow: ExternalIdentityRow = {
        provider: event.provider,
        external_member_id: event.external_member_id,
        last_seen_at: event.occurred_at,
      };

      if (event.email) identityRow.email = event.email;
      if (event.phone) identityRow.phone = event.phone;
      if (event.display_name) identityRow.display_name = event.display_name;

      if (resolvedMemberId) {
        identityRow.profile_id = resolvedMemberId;
        identityRow.auto_linked = Boolean(emailProfileId && emailProfileId === resolvedMemberId);
        identityRow.linked_at = existingIdentity?.linked_at || nowIso;
      }

      identityRows.push(identityRow);
    }
  }

  if (dryRun) {
    return {
      status: "dry_run",
      inserted_external_events: externalRows.length,
      inserted_attendance_facts: attendanceRows.length,
      identity_updates: mergeIdentityRows(identityRows).length,
      refreshed_rollups: false,
      unmapped_external_events: unmappedExternalEventIds.size,
      unmapped_event_ids: [...unmappedExternalEventIds],
    };
  }

  let insertedExternalEvents = 0;
  let insertedAttendanceFacts = 0;
  let identityUpdates = 0;

  const externalUpsert = await supabase
    .from("external_events")
    .upsert(externalRows, { onConflict: "provider,dedupe_key" })
    .select("id, dedupe_key");

  if (externalUpsert.error) throw externalUpsert.error;
  insertedExternalEvents = externalUpsert.data?.length ?? 0;

  const externalByDedupe = new Map(
    (externalUpsert.data ?? []).map((row) => [row.dedupe_key, row.id]),
  );

  if (attendanceRows.length > 0) {
    const attendancePayload = attendanceRows.map((row) => ({
      ...row,
      raw_external_event_id:
        typeof row.dedupe_key === "string"
          ? externalByDedupe.get(String(row.dedupe_key).replace(/^attendance:/, "")) || null
          : null,
    }));

    const attendanceUpsert = await supabase
      .from("event_attendance_facts")
      .upsert(attendancePayload, { onConflict: "provider,dedupe_key" })
      .select("id");

    if (attendanceUpsert.error) throw attendanceUpsert.error;
    insertedAttendanceFacts = attendanceUpsert.data?.length ?? 0;
  }

  const mergedIdentities = mergeIdentityRows(identityRows);
  if (mergedIdentities.length > 0) {
    const identityUpsert = await supabase
      .from("external_member_identities")
      .upsert(mergedIdentities as unknown as Record<string, unknown>[], { onConflict: "provider,external_member_id" })
      .select("id");

    if (identityUpsert.error) throw identityUpsert.error;
    identityUpdates = identityUpsert.data?.length ?? 0;
  }

  const refreshResult = await supabase.rpc("refresh_member_event_rollups");
  if (refreshResult.error) throw refreshResult.error;

  return {
    status: "ok",
    inserted_external_events: insertedExternalEvents,
    inserted_attendance_facts: insertedAttendanceFacts,
    identity_updates: identityUpdates,
    refreshed_rollups: true,
    unmapped_external_events: unmappedExternalEventIds.size,
    unmapped_event_ids: [...unmappedExternalEventIds],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    let action = String(body?.action || "health").toLowerCase();
    if (action === "sync") action = "ingest";

    const isPublicReadAction = PUBLIC_READ_ACTIONS.has(action);
    let authMode: AuthMode | null = null;

    if (!isPublicReadAction) {
      const authResult = await resolveAuth(req, supabase);
      if (!authResult.ok) {
        const failedAuth = authResult as AuthResultFail;
        return jsonResponse({ error: failedAuth.error }, failedAuth.status);
      }

      authMode = authResult.mode;
    }

    if (authMode === "sync_secret" && !WEBHOOK_ALLOWED_ACTIONS.has(action)) {
      return jsonResponse({ error: "Action not allowed for sync-secret clients" }, 403);
    }

    if (ADMIN_ONLY_ACTIONS.has(action) && authMode !== "admin_jwt") {
      return jsonResponse({ error: "Admin access required for this action" }, 403);
    }

    if (action === "health") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [
        externalCount,
        attendanceCount,
        eventRollupCount,
        memberRollupCount,
        lastSyncRow,
        ingestedLast24h,
        unmappedCount,
        scheduleCount,
        workoutScheduleCount,
        lastScheduleSyncRow,
      ] =
        await Promise.all([
          supabase.from("external_events").select("id", { count: "exact", head: true }),
          supabase.from("event_attendance_facts").select("id", { count: "exact", head: true }),
          supabase.from("event_rollups").select("external_event_id", { count: "exact", head: true }),
          supabase.from("member_activity_rollups").select("member_id", { count: "exact", head: true }),
          supabase
            .from("external_events")
            .select("ingested_at")
            .order("ingested_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("external_events")
            .select("id", { count: "exact", head: true })
            .gte("created_at", twentyFourHoursAgo),
          supabase
            .from("external_events")
            .select("id", { count: "exact", head: true })
            .is("event_id", null)
            .not("event_type", "like", "member_%"),
          supabase.from("sweatpals_schedule_events").select("id", { count: "exact", head: true }),
          supabase
            .from("sweatpals_schedule_events")
            .select("id", { count: "exact", head: true })
            .eq("is_workout", true),
          supabase
            .from("sweatpals_schedule_events")
            .select("synced_at, updated_at")
            .order("synced_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      let lastWebhookAt: string | null = null;
      let lastWebhookStatus: string | null = null;
      let errorsLast24h = 0;
      let recentRuns: Array<Record<string, unknown>> = [];

      const recentRunsResult = await supabase
        .from("integration_ingestion_runs")
        .select("id, action, status, triggered_by, event_count, inserted_external_events, inserted_attendance_facts, identity_updates, unmapped_events, error_count, created_at")
        .eq("provider", "sweatpals")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!recentRunsResult.error) {
        recentRuns = recentRunsResult.data ?? [];
        const lastWebhook = recentRuns.find((run) => run.triggered_by === "webhook");
        if (lastWebhook) {
          lastWebhookAt = typeof lastWebhook.created_at === "string" ? lastWebhook.created_at : null;
          lastWebhookStatus = typeof lastWebhook.status === "string" ? lastWebhook.status : null;
        }
      }

      const errorsResult = await supabase
        .from("integration_ingestion_runs")
        .select("id", { count: "exact", head: true })
        .eq("provider", "sweatpals")
        .gte("created_at", twentyFourHoursAgo)
        .neq("status", "ok");

      if (!errorsResult.error) {
        errorsLast24h = errorsResult.count ?? 0;
      }

      return jsonResponse({
        status: errorsLast24h > 0 ? "degraded" : "ok",
        provider: "sweatpals",
        last_synced_at: lastSyncRow.data?.ingested_at ?? null,
        last_webhook_at: lastWebhookAt,
        last_webhook_status: lastWebhookStatus,
        external_events_count: externalCount.count ?? 0,
        attendance_facts_count: attendanceCount.count ?? 0,
        event_rollups_count: eventRollupCount.count ?? 0,
        member_rollups_count: memberRollupCount.count ?? 0,
        schedule_events_count: scheduleCount.count ?? 0,
        schedule_workouts_count: workoutScheduleCount.count ?? 0,
        schedule_last_synced_at: pickString(
          lastScheduleSyncRow.data?.synced_at,
          lastScheduleSyncRow.data?.updated_at,
        ),
        ingested_last_24h: ingestedLast24h.count ?? 0,
        unmapped_external_events: unmappedCount.count ?? 0,
        errors_last_24h: errorsLast24h,
        recent_runs: recentRuns,
      });
    }

    if (action === "sync_schedule") {
      const communityUsername = pickString(
        body?.community_username,
        Deno.env.get("SWEATPALS_COMMUNITY_USERNAME"),
        "Men_In_The_Arena",
      );
      const periodFrom =
        parseEventDate(pickString(body?.period_from, body?.from)) || new Date().toISOString();
      const limit = clampLimit(body?.limit, DEFAULT_SCHEDULE_LIMIT, MAX_SCHEDULE_LIMIT);
      const dryRun = Boolean(body?.dry_run);
      const apiBase = getSweatpalsApiBase(body?.api_base);

      if (!communityUsername) {
        return jsonResponse({ error: "community_username is required" }, 400);
      }

      try {
        const result = await syncSweatpalsSchedule(supabase, {
          communityUsername,
          periodFrom,
          limit,
          dryRun,
          apiBase,
        });

        await writeIngestionRun(supabase, {
          provider: "sweatpals",
          action: "sync_schedule",
          status: "ok",
          triggered_by: authMode === "sync_secret" ? "webhook" : "admin_schedule_sync",
          event_count: result.fetched,
          inserted_external_events: result.upserted,
          unmapped_events: 0,
          result_payload: result,
        });

        return jsonResponse(result);
      } catch (error) {
        await writeIngestionRun(supabase, {
          provider: "sweatpals",
          action: "sync_schedule",
          status: "error",
          triggered_by: authMode === "sync_secret" ? "webhook" : "admin_schedule_sync",
          error_count: 1,
          errors: [error instanceof Error ? error.message : "Unexpected error"],
        });
        throw error;
      }
    }

    if (action === "public_schedule") {
      const communityUsername = pickString(
        body?.community_username,
        Deno.env.get("SWEATPALS_COMMUNITY_USERNAME"),
        "Men_In_The_Arena",
      );
      const fromIso = parseEventDate(pickString(body?.from, body?.period_from)) || new Date().toISOString();
      const limit = clampLimit(body?.limit, 30, MAX_SCHEDULE_LIMIT);
      const workoutsOnly = body?.workouts_only === undefined ? false : Boolean(body?.workouts_only);
      const autoSyncMinutes = clampAutoSyncMinutes(
        body?.auto_sync_minutes ?? Deno.env.get("SWEATPALS_SCHEDULE_AUTO_SYNC_MINUTES"),
      );
      const apiBase = getSweatpalsApiBase(body?.api_base);

      if (communityUsername) {
        await maybeAutoSyncSchedule(supabase, {
          communityUsername,
          periodFrom: fromIso,
          apiBase,
          autoSyncMinutes,
          sourceAction: "public_schedule",
        });
      }

      let scheduleQuery = supabase
        .from("sweatpals_schedule_events")
        .select("external_event_id, title, starts_at, ends_at, location, image_url, event_url, checkout_url, alias, event_type, is_workout")
        .eq("provider", "sweatpals")
        .gte("starts_at", fromIso)
        .order("starts_at", { ascending: true })
        .limit(limit);

      if (communityUsername) {
        scheduleQuery = scheduleQuery.eq("community_username", communityUsername);
      }

      if (workoutsOnly) {
        scheduleQuery = scheduleQuery.eq("is_workout", true);
      }

      const scheduleResult = await scheduleQuery;
      if (scheduleResult.error) {
        console.error("public_schedule query failed", scheduleResult.error.message);
        return jsonResponse({
          status: "ok",
          items: [],
          from: fromIso,
          workouts_only: workoutsOnly,
        });
      }

      return jsonResponse({
        status: "ok",
        from: fromIso,
        workouts_only: workoutsOnly,
        items: (scheduleResult.data ?? []).map((row) => ({
          external_event_id: row.external_event_id,
          title: row.title,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          location: row.location,
          image_url: row.image_url,
          event_url: toEventPageUrl(row.event_url, row.checkout_url),
          checkout_url: null,
          event_alias: row.alias,
          event_type: row.event_type,
          is_workout: row.is_workout,
        })),
      });
    }

    if (action === "public_next_workout") {
      const now = new Date();
      const communityUsername = pickString(
        body?.community_username,
        Deno.env.get("SWEATPALS_COMMUNITY_USERNAME"),
        "Men_In_The_Arena",
      );
      const periodFrom =
        parseEventDate(pickString(body?.from, body?.period_from)) || now.toISOString();
      const autoSyncMinutes = clampAutoSyncMinutes(
        body?.auto_sync_minutes ?? Deno.env.get("SWEATPALS_SCHEDULE_AUTO_SYNC_MINUTES"),
      );
      const apiBase = getSweatpalsApiBase(body?.api_base);

      if (communityUsername) {
        await maybeAutoSyncSchedule(supabase, {
          communityUsername,
          periodFrom,
          apiBase,
          autoSyncMinutes,
          sourceAction: "public_next_workout",
        });
      }

      let scheduleQuery = supabase
        .from("sweatpals_schedule_events")
        .select("external_event_id, title, starts_at, ends_at, location, alias, event_url, checkout_url")
        .eq("provider", "sweatpals")
        .eq("is_workout", true)
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true })
        .limit(1);

      if (communityUsername) {
        scheduleQuery = scheduleQuery.eq("community_username", communityUsername);
      }

      const scheduleResult = await scheduleQuery.maybeSingle();

      if (!scheduleResult.error && scheduleResult.data) {
        const externalEventId = scheduleResult.data.external_event_id;
        let featuredEventId: string | null = null;
        let destinationPath: string | null = null;
        let destinationUrl: string | null = toEventPageUrl(
          scheduleResult.data.event_url,
          scheduleResult.data.checkout_url,
        );

        const mappingResult = await supabase
          .from("external_event_mappings")
          .select("featured_event_id")
          .eq("provider", "sweatpals")
          .eq("external_event_id", externalEventId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (!mappingResult.error) {
          featuredEventId = pickString(mappingResult.data?.featured_event_id);
        }

        if (featuredEventId) {
          const featuredEventResult = await supabase
            .from("featured_events")
            .select("event_path, hero_cta_url, registration_url")
            .eq("id", featuredEventId)
            .maybeSingle();

          if (!featuredEventResult.error && featuredEventResult.data) {
            destinationPath = pickString(featuredEventResult.data.event_path) || null;
            destinationUrl = pickString(
              featuredEventResult.data.hero_cta_url,
              featuredEventResult.data.registration_url,
              destinationUrl,
            ) || null;
          }
        }

        return jsonResponse({
          status: "ok",
          item: {
            external_event_id: externalEventId,
            featured_event_id: featuredEventId,
            title: scheduleResult.data.title,
            starts_at: scheduleResult.data.starts_at,
            ends_at: scheduleResult.data.ends_at,
            location: scheduleResult.data.location,
            event_alias: scheduleResult.data.alias,
            destination_path: destinationPath,
            destination_url: destinationUrl,
          },
        });
      }

      if (scheduleResult.error) {
        console.error("public_next_workout schedule lookup failed", scheduleResult.error.message);
      }

      const externalEventsResult = await supabase
        .from("external_events")
        .select("external_event_id, event_id, payload_json, occurred_at, event_type")
        .eq("provider", "sweatpals")
        .not("external_event_id", "is", null)
        .not("event_type", "like", "member_%")
        .order("occurred_at", { ascending: false })
        .limit(1000);

      if (externalEventsResult.error) throw externalEventsResult.error;

      type NextWorkoutCandidate = {
        external_event_id: string;
        featured_event_id: string | null;
        title: string;
        starts_at: string;
        ends_at: string | null;
        location: string | null;
        event_alias: string | null;
      };

      const dedupedByExternalEvent = new Map<string, NextWorkoutCandidate>();

      for (const row of externalEventsResult.data ?? []) {
        const externalEventId =
          typeof row.external_event_id === "string" ? row.external_event_id : null;
        if (!externalEventId || dedupedByExternalEvent.has(externalEventId)) continue;

        const payload = (row.payload_json as Record<string, unknown>) || {};
        const eventName = extractEventName(payload);
        const eventAlias = pickString(
          payload.event_alias,
          payload.alias,
          payload.eventAlias,
          payload["Event Alias"],
        );

        if (!isWorkoutLikeEvent(eventName, eventAlias)) continue;

        const startsAt = parseEventDate(
          pickString(
            payload.event_full_date,
            payload.eventFullDate,
            payload.event_date,
            payload.eventDate,
            payload.start_at,
            payload.starts_at,
            payload.startDate,
            payload.event_short_date,
            payload.eventShortDate,
            payload["Event Full Date"],
            payload["Event Short Date"],
          ),
        );
        if (!startsAt) continue;
        if (new Date(startsAt) < now) continue;

        const endsAt = parseEventDate(
          pickString(
            payload.event_full_end_date,
            payload.eventFullEndDate,
            payload.end_at,
            payload.ends_at,
            payload.endDate,
            payload["Event Full End Date"],
          ),
        );

        const location = pickString(
          payload.event_location,
          payload.location,
          payload.venue_name,
          payload.venue,
          payload["Event Location"],
        );

        dedupedByExternalEvent.set(externalEventId, {
          external_event_id: externalEventId,
          featured_event_id: typeof row.event_id === "string" ? row.event_id : null,
          title: eventName || "MTA Workout",
          starts_at: startsAt,
          ends_at: endsAt,
          location,
          event_alias: eventAlias,
        });
      }

      const nextWorkout = [...dedupedByExternalEvent.values()]
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] || null;

      if (!nextWorkout) {
        return jsonResponse({
          status: "ok",
          item: null,
        });
      }

      let destinationPath: string | null = null;
      let destinationUrl: string | null = null;

      if (nextWorkout.featured_event_id) {
        const featuredEventResult = await supabase
          .from("featured_events")
          .select("event_path, hero_cta_url, registration_url")
          .eq("id", nextWorkout.featured_event_id)
          .maybeSingle();

        if (!featuredEventResult.error && featuredEventResult.data) {
          destinationPath = pickString(featuredEventResult.data.event_path) || null;
          destinationUrl = pickString(
            featuredEventResult.data.hero_cta_url,
            featuredEventResult.data.registration_url,
          ) || null;
        }
      }

      if (!destinationUrl && nextWorkout.event_alias) {
        destinationUrl = buildSweatpalsEventUrls(nextWorkout.event_alias, "event", null).event_url;
      }

      return jsonResponse({
        status: "ok",
        item: {
          ...nextWorkout,
          destination_path: destinationPath,
          destination_url: destinationUrl,
        },
      });
    }

    if (action === "ingest") {
      const events = Array.isArray(body?.events) ? (body.events as RawEvent[]) : [];
      if (events.length === 0) {
        return jsonResponse(
          { error: "No events provided. Webhook ingest expects body.events to be a non-empty array." },
          400,
        );
      }

      const dryRun = Boolean(body?.dry_run);
      try {
        const result = await ingestEvents(supabase, events, dryRun);
        await writeIngestionRun(supabase, {
          provider: "sweatpals",
          action: "ingest",
          status: "ok",
          triggered_by: authMode === "sync_secret" ? "webhook" : "admin_ingest",
          event_count: events.length,
          inserted_external_events: result.inserted_external_events,
          inserted_attendance_facts: result.inserted_attendance_facts,
          identity_updates: result.identity_updates,
          unmapped_events: result.unmapped_external_events,
          result_payload: result,
        });

        return jsonResponse({
          ...result,
          fetched_from_endpoints: 0,
          endpoint_errors: [],
        });
      } catch (error) {
        await writeIngestionRun(supabase, {
          provider: "sweatpals",
          action: "ingest",
          status: "error",
          triggered_by: authMode === "sync_secret" ? "webhook" : "admin_ingest",
          event_count: events.length,
          error_count: 1,
          errors: [error instanceof Error ? error.message : "Unexpected error"],
        });
        throw error;
      }
    }

    if (action === "test_ingest") {
      const suppliedEvents = Array.isArray(body?.events) ? (body.events as RawEvent[]) : [];
      const sampleEvents = suppliedEvents.length > 0
        ? suppliedEvents
        : [{
            id: crypto.randomUUID(),
            event_type: "ticketed",
            external_event_id: "sample-event",
            external_member_id: `sample-member-${Date.now()}`,
            email: "sample-member@example.com",
            occurred_at: new Date().toISOString(),
            source: "admin-test",
          }];

      const persist = Boolean(body?.persist);
      const dryRun = !persist;

      const result = await ingestEvents(supabase, sampleEvents, dryRun);
      await writeIngestionRun(supabase, {
        provider: "sweatpals",
        action: "test_ingest",
        status: "ok",
        triggered_by: "admin_test",
        event_count: sampleEvents.length,
        inserted_external_events: result.inserted_external_events,
        inserted_attendance_facts: result.inserted_attendance_facts,
        identity_updates: result.identity_updates,
        unmapped_events: result.unmapped_external_events,
        result_payload: result,
      });

      return jsonResponse(result);
    }

    if (action === "replay") {
      const refreshResult = await supabase.rpc("refresh_member_event_rollups");
      if (refreshResult.error) throw refreshResult.error;

      await writeIngestionRun(supabase, {
        provider: "sweatpals",
        action: "replay",
        status: "ok",
        triggered_by: "admin_replay",
      });

      return jsonResponse({
        status: "ok",
        refreshed_rollups: true,
      });
    }

    if (action === "list_unmapped") {
      const limit = Math.min(Math.max(Number(body?.limit || 25), 1), 100);
      const { data, error } = await supabase
        .from("external_events")
        .select("external_event_id, event_type, occurred_at, payload_json")
        .is("event_id", null)
        .not("external_event_id", "is", null)
        .order("occurred_at", { ascending: false })
        .limit(limit * 20);

      if (error) throw error;

      const grouped = new Map<
        string,
        {
          external_event_id: string;
          occurrence_count: number;
          latest_occurred_at: string;
          event_types: Set<string>;
          sample_event_name: string | null;
        }
      >();

      for (const row of data ?? []) {
        if (typeof row.event_type === "string" && row.event_type.startsWith("member_")) continue;
        const key = row.external_event_id;
        const existing = grouped.get(key);
        const sampleName = extractEventName((row.payload_json as Record<string, unknown>) || {});

        if (!existing) {
          grouped.set(key, {
            external_event_id: key,
            occurrence_count: 1,
            latest_occurred_at: row.occurred_at,
            event_types: new Set([row.event_type]),
            sample_event_name: sampleName,
          });
          continue;
        }

        existing.occurrence_count += 1;
        existing.event_types.add(row.event_type);
        if (row.occurred_at > existing.latest_occurred_at) {
          existing.latest_occurred_at = row.occurred_at;
          if (sampleName) existing.sample_event_name = sampleName;
        }
      }

      const items = [...grouped.values()]
        .sort((a, b) => b.latest_occurred_at.localeCompare(a.latest_occurred_at))
        .slice(0, limit)
        .map((item) => ({
          external_event_id: item.external_event_id,
          occurrence_count: item.occurrence_count,
          latest_occurred_at: item.latest_occurred_at,
          event_types: [...item.event_types].sort(),
          sample_event_name: item.sample_event_name,
        }));

      return jsonResponse({
        status: "ok",
        items,
      });
    }

    if (action === "list_mappings") {
      const { data, error } = await supabase
        .from("external_event_mappings")
        .select("id, provider, external_event_id, external_event_name, featured_event_id, is_active, created_at, updated_at")
        .eq("provider", "sweatpals")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const featuredEventIds = [...new Set((data ?? []).map((row) => row.featured_event_id))];
      let featuredById = new Map<string, { id: string; title: string; slug: string }>();

      if (featuredEventIds.length > 0) {
        const featuredResult = await supabase
          .from("featured_events")
          .select("id, title, slug")
          .in("id", featuredEventIds);

        if (!featuredResult.error) {
          featuredById = new Map(
            (featuredResult.data ?? []).map((event) => [event.id, event]),
          );
        }
      }

      return jsonResponse({
        status: "ok",
        items: (data ?? []).map((row) => ({
          ...row,
          featured_event: featuredById.get(row.featured_event_id) ?? null,
        })),
      });
    }

    if (action === "save_mapping") {
      const provider = "sweatpals";
      const externalEventId = pickString(body?.external_event_id);
      const featuredEventId = pickString(body?.featured_event_id);
      const externalEventName = pickString(body?.external_event_name);
      const isActive = body?.is_active === undefined ? true : Boolean(body?.is_active);

      if (!externalEventId || !featuredEventId) {
        return jsonResponse({ error: "external_event_id and featured_event_id are required" }, 400);
      }

      const mappingUpsert = await supabase
        .from("external_event_mappings")
        .upsert({
          provider,
          external_event_id: externalEventId,
          external_event_name: externalEventName,
          featured_event_id: featuredEventId,
          is_active: isActive,
        }, { onConflict: "provider,external_event_id" })
        .select("id, provider, external_event_id, external_event_name, featured_event_id, is_active, created_at, updated_at")
        .single();

      if (mappingUpsert.error) throw mappingUpsert.error;

      const externalUpdate = await supabase
        .from("external_events")
        .update({ event_id: featuredEventId })
        .eq("provider", provider)
        .eq("external_event_id", externalEventId)
        .is("event_id", null)
        .select("id");

      if (externalUpdate.error) throw externalUpdate.error;

      const attendanceUpdate = await supabase
        .from("event_attendance_facts")
        .update({ event_id: featuredEventId })
        .eq("provider", provider)
        .eq("external_event_id", externalEventId)
        .is("event_id", null)
        .select("id");

      if (attendanceUpdate.error) throw attendanceUpdate.error;

      const refreshResult = await supabase.rpc("refresh_member_event_rollups");
      if (refreshResult.error) throw refreshResult.error;

      await writeIngestionRun(supabase, {
        provider: "sweatpals",
        action: "save_mapping",
        status: "ok",
        triggered_by: "admin_mapping",
        inserted_external_events: externalUpdate.data?.length ?? 0,
        inserted_attendance_facts: attendanceUpdate.data?.length ?? 0,
        result_payload: {
          external_event_id: externalEventId,
          featured_event_id: featuredEventId,
        },
      });

      return jsonResponse({
        status: "ok",
        mapping: mappingUpsert.data,
        linked_external_events: externalUpdate.data?.length ?? 0,
        linked_attendance_facts: attendanceUpdate.data?.length ?? 0,
      });
    }

    if (action === "cleanup_errors") {
      const { error } = await supabase
        .from("external_events")
        .delete()
        .not("sync_error", "is", null);

      if (error) throw error;
      return jsonResponse({ status: "ok", cleaned: true });
    }

    return jsonResponse({ error: "Unsupported action" }, 400);
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      500,
    );
  }
});
