// ============================================================================
// subscribe — newsletter "REQUEST CLEARANCE" handler for ZERO-ACCOUNT.com
// ----------------------------------------------------------------------------
// This is the ONLY write path into the za_subscribers table. The browser can
// no longer insert directly (that grant was revoked), so every check below is
// unavoidable.
//
// It enforces, server-side:
//   - email format and length            (cannot be skipped by crafting a request)
//   - lowercase normalisation            (case-variant duplicates impossible)
//   - the `source` label                 (never taken from the request body)
//   - a per-IP rate limit                (atomic claim, platform-derived address)
//   - a uniform response                 (does not reveal list membership)
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

// Rate limit: at most this many signup attempts per IP per window.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;

// RFC 5321 caps a forward path at 254 characters.
const EMAIL_MAX_LENGTH = 254;
const EMAIL_MIN_LENGTH = 3;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The source label is decided here, never by the caller.
const SOURCE = "zero_account_site";

/** One-way hash of the client IP so no raw network address is stored. */
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`za:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive the caller's network address for rate-limiting purposes.
 *
 * Verified against the live gateway before choosing this order:
 *
 *   - `cf-connecting-ip` is set by the edge and holds the single real client
 *     address. A caller that tries to supply this header itself is rejected at
 *     the edge before the function runs, so it cannot be forged. This is the
 *     primary key.
 *   - `x-forwarded-for` arrives as `<client>,<client>, <edge relay>`. The caller's
 *     own value is stripped by the gateway, but the LAST entry is an edge relay
 *     address that rotates per request — keying on it would hand every request a
 *     fresh bucket and silently disable the limit. So the FIRST entry, the real
 *     client, is the fallback.
 *   - `x-real-ip` is a last resort, then a fixed shared bucket.
 */
function clientIp(req: Request): string {
  const edgeIp = req.headers.get("cf-connecting-ip")?.trim();
  if (edgeIp) return edgeIp;

  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const first = fwd
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  if (first) return first;

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, reason: "method_not_allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // ---- Parse input -----------------------------------------------------
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_request" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const rawEmail = (body as { email?: unknown } | null)?.email;
    if (typeof rawEmail !== "string") {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_email" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // Reject oversized payloads BEFORE any further work (F3).
    if (rawEmail.length > EMAIL_MAX_LENGTH) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_email" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // Normalise to the canonical form (F6).
    const email = rawEmail.trim().toLowerCase();

    // Re-validate format server-side (F2).
    if (
      email.length < EMAIL_MIN_LENGTH ||
      email.length > EMAIL_MAX_LENGTH ||
      !EMAIL_SHAPE.test(email)
    ) {
      return new Response(JSON.stringify({ ok: false, reason: "invalid_email" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // ---- Rate limit ------------------------------------------------------
    // The claim and the check happen inside ONE database transaction, so two
    // requests arriving at the same instant cannot both read a stale count and
    // both be admitted. The function records the attempt first, then measures.
    const ipHash = await hashIp(clientIp(req));

    const { data: withinLimit, error: limitError } = await supabase.rpc(
      "za_claim_subscribe_attempt",
      {
        p_ip_hash: ipHash,
        p_max: RATE_LIMIT_MAX,
        p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
      },
    );

    if (limitError || typeof withinLimit !== "boolean") {
      // Fail closed: if the limiter cannot be consulted, do not accept the write.
      return new Response(JSON.stringify({ ok: false, reason: "unavailable" }), {
        status: 503,
        headers: JSON_HEADERS,
      });
    }

    if (!withinLimit) {
      return new Response(JSON.stringify({ ok: false, reason: "rate_limited" }), {
        status: 429,
        headers: JSON_HEADERS,
      });
    }

    // ---- Insert ----------------------------------------------------------
    // `source` is set here, never read from the request body (F5).
    const { error: insertError } = await supabase
      .from("za_subscribers")
      .insert({ email, source: SOURCE });

    if (insertError) {
      // 23505 = unique_violation. The address is already on the list.
      // Return the SAME response as a fresh signup so the endpoint cannot be
      // used to test whether an address is subscribed (F4).
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: JSON_HEADERS,
        });
      }
      // Any other database error: generic reason only, never the raw error.
      return new Response(JSON.stringify({ ok: false, reason: "unavailable" }), {
        status: 503,
        headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch {
    // Never surface the underlying error object to the caller.
    return new Response(JSON.stringify({ ok: false, reason: "unavailable" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
