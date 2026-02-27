import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type ReminderMode = "send" | "dry_run";
type ReminderAction = "send_reminders" | "configure_schedule" | "get_schedule";

interface ReminderRequestBody {
  action?: ReminderAction;
  mode?: ReminderMode;
  limit?: number;
  timezone_fallback?: string;
  minute?: number;
}

interface AssignmentRow {
  id: string;
  schedule_event_id: string;
  leader_id: string;
  status: string;
  day_of_reminder_sent_at: string | null;
}

interface ScheduleEventRow {
  id: string;
  starts_at: string;
  timezone: string | null;
  title: string | null;
  location: string | null;
}

interface LeaderProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface ReminderResult {
  assignment_id: string;
  leader_email: string | null;
  event_starts_at: string;
  timezone: string;
  action: "sent" | "skipped" | "error";
  reason: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-reminder-secret",
};

function jsonResponse(payload: unknown, status = 200): Response {
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

function getPreferredEnv(names: string[], fallback?: string): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value && value.trim().length > 0) return value.trim();
  }

  if (fallback) return fallback;
  throw new Error(`Missing one of required environment variables: ${names.join(", ")}`);
}

function getZonedParts(date: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const partMap = new Map<string, string>();
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      partMap.set(part.type, part.value);
    }
  }

  return {
    year: Number(partMap.get("year") ?? "0"),
    month: Number(partMap.get("month") ?? "0"),
    day: Number(partMap.get("day") ?? "0"),
    hour: Number(partMap.get("hour") ?? "0"),
    minute: Number(partMap.get("minute") ?? "0"),
  };
}

function isSameLocalDate(a: Date, b: Date, timeZone: string): boolean {
  const ap = getZonedParts(a, timeZone);
  const bp = getZonedParts(b, timeZone);
  return ap.year === bp.year && ap.month === bp.month && ap.day === bp.day;
}

function shouldSendNow(now: Date, eventStart: Date, timeZone: string): boolean {
  if (!isSameLocalDate(now, eventStart, timeZone)) return false;
  const nowParts = getZonedParts(now, timeZone);
  return nowParts.hour === 6;
}

function formatLocalDateTime(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

function extractChecklist(contentJson: unknown, limit = 5): string[] {
  if (!contentJson || typeof contentJson !== "object") return [];

  const sections = (contentJson as { sections?: unknown[] }).sections;
  if (!Array.isArray(sections)) return [];

  const items: string[] = [];

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;

    const checklist = (section as { checklist?: unknown[] }).checklist;
    if (!Array.isArray(checklist)) continue;

    for (const entry of checklist) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        items.push(entry.trim());
      }

      if (items.length >= limit) return items;
    }
  }

  return items;
}

function buildReminderEmail(args: {
  leaderName: string;
  workoutTitle: string;
  startsAtLabel: string;
  location: string | null;
  submissionUrl: string;
  checklist: string[];
}): { subject: string; text: string; html: string } {
  const subject = "Today's MTA Workout Leadership Reminder";

  const listLines = args.checklist.length
    ? args.checklist.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : [
        "1. Arrive early and align with the host.",
        "2. Keep the workout structure simple and clear.",
        "3. Set a clear message for the men.",
        "4. Include challenge with safe scaling options.",
        "5. Close by bringing the group together.",
      ].join("\n");

  const text = [
    `Hey ${args.leaderName},`,
    "",
    "You are leading today's MTA workout.",
    "",
    `Workout: ${args.workoutTitle}`,
    `When: ${args.startsAtLabel}`,
    `Where: ${args.location || "Location TBD"}`,
    "",
    "Leader checklist:",
    listLines,
    "",
    `Open your submission plan: ${args.submissionUrl}`,
    "",
    "Lead with presence. Keep it clear, challenging, and inclusive.",
  ].join("\n");

  const htmlList = (args.checklist.length
    ? args.checklist
    : [
        "Arrive early and align with the host.",
        "Keep the workout structure simple and clear.",
        "Set a clear message for the men.",
        "Include challenge with safe scaling options.",
        "Close by bringing the group together.",
      ])
    .map((item) => `<li>${item}</li>`)
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hey ${args.leaderName},</p>
      <p>You are leading today's MTA workout.</p>
      <p><strong>Workout:</strong> ${args.workoutTitle}<br />
      <strong>When:</strong> ${args.startsAtLabel}<br />
      <strong>Where:</strong> ${args.location || "Location TBD"}</p>
      <p><strong>Leader checklist</strong></p>
      <ol>${htmlList}</ol>
      <p><a href="${args.submissionUrl}">Open your submission plan</a></p>
      <p>Lead with presence. Keep it clear, challenging, and inclusive.</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendWithResend(args: {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      from: args.fromEmail,
      to: [args.toEmail],
      reply_to: args.replyTo,
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend API failed (${response.status}): ${message}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as ReminderRequestBody;
    const action: ReminderAction = body.action || "send_reminders";
    const mode: ReminderMode = body.mode === "dry_run" ? "dry_run" : "send";
    const limit = Math.max(1, Math.min(Number(body.limit ?? 120), 500));
    const timezoneFallback = body.timezone_fallback || "America/Chicago";

    const reminderSecret = Deno.env.get("WORKOUT_REMINDER_SECRET");
    if (!reminderSecret || reminderSecret.trim().length === 0) {
      return jsonResponse(
        {
          error: "Missing WORKOUT_REMINDER_SECRET. Configure it before invoking this function.",
        },
        500,
      );
    }

    const incomingSecret = req.headers.get("x-reminder-secret");
    if (incomingSecret !== reminderSecret) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (action === "configure_schedule") {
      const minute = Math.max(0, Math.min(Number(body.minute ?? 5), 59));

      const { data: jobId, error: configureError } = await supabase.rpc(
        "configure_workout_leader_reminder_schedule",
        {
          p_secret: reminderSecret,
          p_mode: mode,
          p_minute: minute,
        },
      );

      if (configureError) {
        throw new Error(`Failed to configure reminder schedule: ${configureError.message}`);
      }

      const { data: scheduleRows, error: scheduleError } = await supabase.rpc(
        "get_workout_leader_reminder_schedule",
      );

      if (scheduleError) {
        throw new Error(`Schedule configured but failed to load schedule: ${scheduleError.message}`);
      }

      return jsonResponse({
        status: "ok",
        action,
        mode,
        minute,
        job_id: jobId,
        schedule: scheduleRows || [],
      });
    }

    if (action === "get_schedule") {
      const { data: scheduleRows, error: scheduleError } = await supabase.rpc(
        "get_workout_leader_reminder_schedule",
      );

      if (scheduleError) {
        throw new Error(`Failed to load reminder schedule: ${scheduleError.message}`);
      }

      return jsonResponse({
        status: "ok",
        action,
        schedule: scheduleRows || [],
      });
    }

    const now = new Date();

    const assignmentResult = await supabase
      .from("workout_lead_assignments")
      .select("id, schedule_event_id, leader_id, status, day_of_reminder_sent_at")
      .eq("status", "assigned")
      .is("day_of_reminder_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (assignmentResult.error) {
      throw new Error(`Failed to load workout assignments: ${assignmentResult.error.message}`);
    }

    const assignments = (assignmentResult.data || []) as AssignmentRow[];
    if (assignments.length === 0) {
      return jsonResponse({
        mode,
        timezone_fallback: timezoneFallback,
        total_candidates: 0,
        sent: 0,
        skipped: 0,
        errors: 0,
        results: [] as ReminderResult[],
      });
    }

    const scheduleEventIds = [...new Set(assignments.map((row) => row.schedule_event_id))];
    const leaderIds = [...new Set(assignments.map((row) => row.leader_id))];

    const [scheduleResult, leaderResult, guideResult] = await Promise.all([
      supabase
        .from("sweatpals_schedule_events")
        .select("id, starts_at, timezone, title, location")
        .in("id", scheduleEventIds),
      supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", leaderIds),
      supabase
        .from("workout_guides")
        .select("content_json")
        .eq("slug", "leader_guidelines")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (scheduleResult.error) {
      throw new Error(`Failed to load schedule events: ${scheduleResult.error.message}`);
    }

    if (leaderResult.error) {
      throw new Error(`Failed to load leader profiles: ${leaderResult.error.message}`);
    }

    if (guideResult.error && guideResult.error.code !== "PGRST116") {
      throw new Error(`Failed to load leader guide: ${guideResult.error.message}`);
    }

    const scheduleById = new Map(
      ((scheduleResult.data || []) as ScheduleEventRow[]).map((row) => [row.id, row]),
    );
    const leaderById = new Map(
      ((leaderResult.data || []) as LeaderProfileRow[]).map((row) => [row.id, row]),
    );

    const guideChecklist = extractChecklist(guideResult.data?.content_json, 5);

    const appBaseUrl = getPreferredEnv([
      "WORKOUT_APP_BASE_URL",
      "PUBLIC_APP_URL",
      "APP_BASE_URL",
      "SITE_URL",
    ], "https://meninthearena.co").replace(/\/$/, "");

    const results: ReminderResult[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const resendApiKey = mode === "send" ? getEnv("RESEND_API_KEY") : "";
    const fromEmail = mode === "send" ? getPreferredEnv(["WORKOUT_REMINDER_FROM_EMAIL", "RESEND_FROM_EMAIL"], "MTA <noreply@meninthearena.co>") : "";
    const replyTo = mode === "send" ? Deno.env.get("WORKOUT_REMINDER_REPLY_TO") || undefined : undefined;

    for (const assignment of assignments) {
      const schedule = scheduleById.get(assignment.schedule_event_id);
      const leader = leaderById.get(assignment.leader_id);

      if (!schedule) {
        skippedCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader?.email || null,
          event_starts_at: "unknown",
          timezone: timezoneFallback,
          action: "skipped",
          reason: "Missing schedule event",
        });
        continue;
      }

      const eventStart = new Date(schedule.starts_at);
      if (Number.isNaN(eventStart.getTime())) {
        skippedCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader?.email || null,
          event_starts_at: schedule.starts_at,
          timezone: schedule.timezone || timezoneFallback,
          action: "skipped",
          reason: "Invalid event start time",
        });
        continue;
      }

      const timezone = schedule.timezone || timezoneFallback;
      if (!shouldSendNow(now, eventStart, timezone)) {
        skippedCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader?.email || null,
          event_starts_at: schedule.starts_at,
          timezone,
          action: "skipped",
          reason: "Outside 6 AM local send window",
        });
        continue;
      }

      if (!leader?.email) {
        skippedCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: null,
          event_starts_at: schedule.starts_at,
          timezone,
          action: "skipped",
          reason: "Leader email missing",
        });
        continue;
      }

      const submissionUrl = `${appBaseUrl}/workout-submit/${assignment.id}`;
      const leaderName = leader.full_name || "brother";
      const startsAtLabel = formatLocalDateTime(eventStart, timezone);

      const email = buildReminderEmail({
        leaderName,
        workoutTitle: schedule.title || "MTA Workout",
        startsAtLabel,
        location: schedule.location,
        submissionUrl,
        checklist: guideChecklist,
      });

      if (mode === "dry_run") {
        sentCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader.email,
          event_starts_at: schedule.starts_at,
          timezone,
          action: "sent",
          reason: "Dry run: would send",
        });
        continue;
      }

      try {
        await sendWithResend({
          apiKey: resendApiKey,
          fromEmail,
          toEmail: leader.email,
          replyTo,
          subject: email.subject,
          text: email.text,
          html: email.html,
        });

        const markSentResult = await supabase
          .from("workout_lead_assignments")
          .update({ day_of_reminder_sent_at: new Date().toISOString() })
          .eq("id", assignment.id)
          .is("day_of_reminder_sent_at", null);

        if (markSentResult.error) {
          throw new Error(`Email sent but failed to mark reminder status: ${markSentResult.error.message}`);
        }

        sentCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader.email,
          event_starts_at: schedule.starts_at,
          timezone,
          action: "sent",
          reason: "Reminder sent",
        });
      } catch (error) {
        errorCount += 1;
        results.push({
          assignment_id: assignment.id,
          leader_email: leader.email,
          event_starts_at: schedule.starts_at,
          timezone,
          action: "error",
          reason: error instanceof Error ? error.message : "Unknown error while sending",
        });
      }
    }

    return jsonResponse({
      mode,
      timezone_fallback: timezoneFallback,
      evaluated_at: now.toISOString(),
      total_candidates: assignments.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      500,
    );
  }
});
