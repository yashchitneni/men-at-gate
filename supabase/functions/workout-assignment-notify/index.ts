import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

type AssignmentNotifySource = "approve_request" | "direct_assign";

interface AssignmentNotifyBody {
  schedule_event_id?: string;
  leader_id?: string;
  source?: AssignmentNotifySource;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function formatDateLabel(startsAtIso: string): string {
  const date = new Date(startsAtIso);
  if (Number.isNaN(date.getTime())) return startsAtIso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function getFirstName(fullName: string | null | undefined, email: string) {
  const name = fullName?.trim() || "";
  if (name) return name.split(/\s+/)[0];
  const localPart = email.split("@")[0] || "brother";
  return localPart.replace(/[._-]+/g, " ").trim().split(/\s+/)[0] || "brother";
}

function buildAssignmentEmail(args: {
  firstName: string;
  eventTitle: string;
  dateLabel: string;
  location: string | null;
  workoutUrl: string;
}) {
  const subject = "You've been assigned to lead a workout";

  const text = [
    `Hey ${args.firstName},`,
    "",
    "You've been assigned as workout leader.",
    "",
    `Workout: ${args.eventTitle}`,
    `When: ${args.dateLabel}`,
    `Where: ${args.location || "Location TBD"}`,
    "",
    `Create your workout plan here: ${args.workoutUrl}`,
    "",
    "Thanks for stepping up.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hey ${args.firstName},</p>
      <p><strong>You've been assigned as workout leader.</strong></p>
      <p>
        <strong>Workout:</strong> ${args.eventTitle}<br />
        <strong>When:</strong> ${args.dateLabel}<br />
        <strong>Where:</strong> ${args.location || "Location TBD"}
      </p>
      <p><a href="${args.workoutUrl}">Create your workout plan</a></p>
      <p>Thanks for stepping up.</p>
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
}) {
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
    const body = await response.text();
    throw new Error(`Resend API failed (${response.status}): ${body}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as AssignmentNotifyBody;
    const scheduleEventId = body.schedule_event_id;
    const leaderId = body.leader_id;
    const source = body.source;

    if (!scheduleEventId || !leaderId || !source) {
      return jsonResponse({ error: "schedule_event_id, leader_id, and source are required" }, 400);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const actorClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: authorization },
      },
    });

    const {
      data: { user: actorUser },
      error: actorError,
    } = await actorClient.auth.getUser();

    if (actorError || !actorUser) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: actorProfile, error: actorProfileError } = await serviceClient
      .from("profiles")
      .select("id, is_admin")
      .eq("id", actorUser.id)
      .maybeSingle();

    if (actorProfileError || !actorProfile?.is_admin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const [{ data: leaderProfile, error: leaderError }, { data: event, error: eventError }, { data: assignment, error: assignmentError }] = await Promise.all([
      serviceClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", leaderId)
        .maybeSingle(),
      serviceClient
        .from("sweatpals_schedule_events")
        .select("id, title, starts_at, location")
        .eq("id", scheduleEventId)
        .maybeSingle(),
      serviceClient
        .from("workout_lead_assignments")
        .select("id")
        .eq("schedule_event_id", scheduleEventId)
        .eq("leader_id", leaderId)
        .eq("status", "assigned")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (leaderError || !leaderProfile?.email) {
      throw new Error("Assigned leader is missing an email address.");
    }

    if (eventError || !event) {
      throw new Error("Workout event not found.");
    }

    if (assignmentError) {
      throw assignmentError;
    }

    const resendApiKey = getEnv("RESEND_API_KEY");
    const fromEmail = getPreferredEnv(["WORKOUT_REMINDER_FROM_EMAIL", "RESEND_FROM_EMAIL"], "MTA <noreply@meninthearena.co>");
    const replyTo = Deno.env.get("WORKOUT_REMINDER_REPLY_TO") || undefined;
    const appBaseUrl = getPreferredEnv([
      "WORKOUT_APP_BASE_URL",
      "PUBLIC_APP_URL",
      "APP_BASE_URL",
      "SITE_URL",
    ], "https://meninthearena.co").replace(/\/$/, "");

    const workoutUrl = assignment?.id ? `${appBaseUrl}/workout-submit/${assignment.id}` : `${appBaseUrl}/workouts`;
    const email = buildAssignmentEmail({
      firstName: getFirstName(leaderProfile.full_name, leaderProfile.email),
      eventTitle: event.title || "MTA Workout",
      dateLabel: formatDateLabel(event.starts_at),
      location: event.location || null,
      workoutUrl,
    });

    await sendWithResend({
      apiKey: resendApiKey,
      fromEmail,
      toEmail: leaderProfile.email,
      replyTo,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    return jsonResponse({
      status: "ok",
      source,
      schedule_event_id: scheduleEventId,
      leader_id: leaderId,
      leader_email: leaderProfile.email,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
