import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

interface ReminderRequestBody {
  profile_id?: string;
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
  if (!value || !value.trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value.trim();
}

function getOptionalEnv(name: string, fallback: string): string {
  const value = Deno.env.get(name);
  if (!value || !value.trim()) return fallback;
  return value.trim();
}

function getPreferredEnv(names: string[], fallback: string): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function getFirstName(inputName: string | null | undefined, email: string): string {
  const fullName = (inputName || "").trim();
  if (fullName.length > 0) {
    const first = fullName.split(/\s+/)[0]?.trim();
    if (first) return first;
  }

  const localPart = email.split("@")[0]?.trim() || "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const first = cleaned.split(/\s+/)[0]?.trim();
  return first || "brother";
}

function buildReminderEmail(args: { firstName: string; profileUrl: string }) {
  const subject = "Complete your Men in the Arena spotlight profile";

  const text = [
    `Hey ${args.firstName},`,
    "",
    "We'd love to feature you in the Men in the Arena brotherhood directory.",
    "",
    "Your spotlight profile only takes a couple of minutes:",
    `Complete my profile: ${args.profileUrl}`,
    "",
    "Once you submit it, our team will review it and schedule your spotlight.",
    "",
    "Appreciate you,",
    "Men in the Arena",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <p>Hey ${args.firstName},</p>
      <p>We'd love to feature you in the Men in the Arena brotherhood directory.</p>
      <p>Your spotlight profile only takes a couple of minutes:</p>
      <p><a href="${args.profileUrl}">Complete my profile</a></p>
      <p>Once you submit it, our team will review it and schedule your spotlight.</p>
      <p>Appreciate you,<br />Men in the Arena</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendReminderEmail(args: {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  text: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.fromEmail,
      to: [args.toEmail],
      subject: args.subject,
      text: args.text,
      html: args.html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${message}`);
  }

  return (await response.json()) as { id?: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const resendApiKey = getEnv("RESEND_API_KEY");
    const fromEmail = getPreferredEnv(
      ["SPOTLIGHT_REMINDER_FROM_EMAIL", "WORKOUT_REMINDER_FROM_EMAIL", "RESEND_FROM_EMAIL"],
      "MTA <noreply@meninthearena.com>",
    );
    const appBaseUrl = getOptionalEnv("APP_BASE_URL", "https://meninthearena.com");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authedClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: requester, error: requesterError } = await authedClient
      .from("profiles")
      .select("id, is_admin, is_super_admin")
      .eq("id", user.id)
      .single();

    if (requesterError || !requester || (!requester.is_admin && !requester.is_super_admin)) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as ReminderRequestBody;
    const profileId = body.profile_id?.trim();

    if (!profileId) {
      return jsonResponse({ error: "profile_id is required" }, 400);
    }

    const { data: targetProfile, error: targetError } = await authedClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", profileId)
      .single();

    if (targetError || !targetProfile?.email) {
      return jsonResponse({ error: "Target profile not found or missing email" }, 404);
    }

    const profileUrl = `${appBaseUrl.replace(/\/$/, "")}/profile`;
    const firstName = getFirstName(targetProfile.full_name, targetProfile.email);
    const emailContent = buildReminderEmail({
      firstName,
      profileUrl,
    });

    const sendResult = await sendReminderEmail({
      apiKey: resendApiKey,
      fromEmail,
      toEmail: targetProfile.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    return jsonResponse({
      status: "ok",
      reminder_id: sendResult.id || null,
      profile_id: targetProfile.id,
      email: targetProfile.email,
    });
  } catch (error) {
    console.error("spotlight-reminders error", error);
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      500,
    );
  }
});
