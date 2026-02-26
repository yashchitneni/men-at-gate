import { supabase } from "@/integrations/supabase/client";

type RestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface SupabaseRestFetchOptions {
  method?: RestMethod;
  body?: unknown;
  token?: string;
  prefer?: string;
  headers?: Record<string, string>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

function getSupabaseHttpConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
    throw new Error(
      "Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: SUPABASE_URL,
    key: SUPABASE_PUBLIC_KEY,
  };
}

export async function supabaseRestFetch<T>(
  path: string,
  options: SupabaseRestFetchOptions = {},
): Promise<T> {
  const { url, key } = getSupabaseHttpConfig();
  const authToken = options.token || key;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${authToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.prefer) {
    headers.Prefer = options.prefer;
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = `Supabase REST request failed (${response.status})`;
    try {
      const err = await response.json();
      message = err.message || err.details || message;
    } catch {
      // Ignore JSON parse issues and keep fallback status message.
    }
    throw new Error(message);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function getCurrentAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Not authenticated. Please sign in and try again.");
  }

  return session.access_token;
}
