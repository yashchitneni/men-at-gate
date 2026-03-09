import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

interface InviteAssignBody {
  email?: string;
  schedule_event_id?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const body = (await req.json().catch(() => ({}))) as InviteAssignBody;
    const { email, schedule_event_id } = body;

    if (!email || !schedule_event_id) {
      return jsonResponse({ error: "email and schedule_event_id are required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const anonKey = getEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    // Verify the caller is an admin
    const actorClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });

    const { data: { user: actorUser }, error: actorError } = await actorClient.auth.getUser();
    if (actorError || !actorUser) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: actorProfile } = await serviceClient
      .from("profiles")
      .select("id, is_admin")
      .eq("id", actorUser.id)
      .maybeSingle();

    if (!actorProfile?.is_admin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Check if profile with this email already exists
    let leaderId: string;
    let isNewUser = false;

    const { data: existingProfile } = await serviceClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      leaderId = existingProfile.id;
    } else {
      // Create the auth user — triggers profile creation via handle_new_user
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

      if (createError) {
        // Handle case where auth user exists but profile doesn't (unlikely but possible)
        if (createError.message?.includes("already been registered")) {
          const { data: { users } } = await serviceClient.auth.admin.listUsers();
          const existing = users?.find((u) => u.email === normalizedEmail);
          if (existing) {
            leaderId = existing.id;
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else {
        leaderId = newUser.user.id;
      }
      isNewUser = true;
    }

    // Assign the workout using the existing RPC
    const { error: assignError } = await serviceClient.rpc("assign_workout_leader_direct", {
      p_schedule_event_id: schedule_event_id,
      p_leader_id: leaderId,
      p_note: null,
    });

    if (assignError) throw assignError;

    // Fetch event and assignment details for the email
    const [{ data: event }, { data: assignment }, { data: leaderProfile }] = await Promise.all([
      serviceClient
        .from("sweatpals_schedule_events")
        .select("id, title, starts_at, location")
        .eq("id", schedule_event_id)
        .maybeSingle(),
      serviceClient
        .from("workout_lead_assignments")
        .select("id")
        .eq("schedule_event_id", schedule_event_id)
        .eq("leader_id", leaderId)
        .eq("status", "assigned")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      serviceClient
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", leaderId)
        .maybeSingle(),
    ]);

    if (!event) throw new Error("Workout event not found.");

    const resendApiKey = getEnv("RESEND_API_KEY");
    const fromEmail = getPreferredEnv(
      ["WORKOUT_REMINDER_FROM_EMAIL", "RESEND_FROM_EMAIL"],
      "MTA <noreply@meninthearena.co>",
    );
    const replyTo = Deno.env.get("WORKOUT_REMINDER_REPLY_TO") || undefined;
    const appBaseUrl = getPreferredEnv(
      ["WORKOUT_APP_BASE_URL", "PUBLIC_APP_URL", "APP_BASE_URL", "SITE_URL"],
      "https://meninthearena.co",
    ).replace(/\/$/, "");

    const workoutUrl = assignment?.id
      ? `${appBaseUrl}/workout-submit/${assignment.id}`
      : `${appBaseUrl}/workouts`;

    const firstName = getFirstName(leaderProfile?.full_name, normalizedEmail);
    const dateLabel = formatDateLabel(event.starts_at);

    const accountNote = isNewUser
      ? "You'll need to create your account when you open the link — just sign up with this email address."
      : "";

    const subject = "You've been assigned to lead a workout";
    const text = [
      `Hey ${firstName},`,
      "",
      "You've been assigned as workout leader.",
      "",
      `Workout: ${event.title || "MTA Workout"}`,
      `When: ${dateLabel}`,
      `Where: ${event.location || "Location TBD"}`,
      "",
      `Create your workout plan here: ${workoutUrl}`,
      ...(accountNote ? ["", accountNote] : []),
      "",
      "Thanks for stepping up.",
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <p>Hey ${firstName},</p>
        <p><strong>You've been assigned as workout leader.</strong></p>
        <p>
          <strong>Workout:</strong> ${event.title || "MTA Workout"}<br />
          <strong>When:</strong> ${dateLabel}<br />
          <strong>Where:</strong> ${event.location || "Location TBD"}
        </p>
        <p><a href="${workoutUrl}">Create your workout plan</a></p>
        ${accountNote ? `<p style="color: #666; font-size: 14px;">${accountNote}</p>` : ""}
        <p>Thanks for stepping up.</p>
      </div>
    `;

    await sendWithResend({
      apiKey: resendApiKey,
      fromEmail,
      toEmail: normalizedEmail,
      replyTo,
      subject,
      text,
      html,
    });

    return jsonResponse({
      status: "ok",
      leader_id: leaderId,
      is_new_user: isNewUser,
      schedule_event_id,
      email: normalizedEmail,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
