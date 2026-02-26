import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

// deno-lint-ignore no-explicit-any
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
  result_payload?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

const WEBHOOK_ALLOWED_ACTIONS = new Set(["health", "ingest"]);
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
    if (!row.featured_event_id) continue;
    mappingByKey.set(`${row.provider}:${row.external_event_id}`, row.featured_event_id);
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
    identities.set(`${row.provider}:${row.external_member_id}`, {
      profile_id: row.profile_id,
      linked_at: row.linked_at,
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

      if (error || !data?.id || !data.email) return;
      results.set(data.email.toLowerCase(), data.id);
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
      .upsert(mergedIdentities, { onConflict: "provider,external_member_id" })
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

    const authResult = await resolveAuth(req, supabase);
    if (!authResult.ok) {
      return jsonResponse({ error: authResult.error }, authResult.status);
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    let action = String(body?.action || "health").toLowerCase();
    if (action === "sync") action = "ingest";

    if (authResult.mode === "sync_secret" && !WEBHOOK_ALLOWED_ACTIONS.has(action)) {
      return jsonResponse({ error: "Action not allowed for sync-secret clients" }, 403);
    }

    if (ADMIN_ONLY_ACTIONS.has(action) && authResult.mode !== "admin_jwt") {
      return jsonResponse({ error: "Admin access required for this action" }, 403);
    }

    if (action === "health") {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [externalCount, attendanceCount, eventRollupCount, memberRollupCount, lastSyncRow, ingestedLast24h, unmappedCount] =
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
        ingested_last_24h: ingestedLast24h.count ?? 0,
        unmapped_external_events: unmappedCount.count ?? 0,
        errors_last_24h: errorsLast24h,
        recent_runs: recentRuns,
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
          triggered_by: authResult.mode === "sync_secret" ? "webhook" : "admin_ingest",
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
          triggered_by: authResult.mode === "sync_secret" ? "webhook" : "admin_ingest",
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
