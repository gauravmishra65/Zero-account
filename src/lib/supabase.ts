// Reads from VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars (see .env).
// The anon key is publishable and safe for client-side use; the service role
// key is never referenced here and never reaches the browser.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Fail loudly in dev so a missing .env is obvious. In production the build is
  // expected to have these injected.
  // eslint-disable-next-line no-console
  console.error('[ZERO_ACCOUNT//] Supabase env missing. Newsletter form will be disabled.');
}

export const supabaseReady = Boolean(url && anonKey);

export type ClearanceResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_email' | 'rate_limited' | 'unavailable' };

/**
 * Submit a newsletter ("REQUEST CLEARANCE") signup.
 *
 * The browser does NOT write to the subscriber list directly — that path is
 * revoked at the database level. This calls a protected server-side handler
 * which validates and normalises the address, decides the source label itself,
 * enforces a per-visitor rate limit, and returns an identical response whether
 * the address was newly added or already on file.
 */
export async function submitClearanceRequest(email: string): Promise<ClearanceResult> {
  if (!supabaseReady) {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const response = await fetch(`${url}/functions/v1/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ email }),
    });

    // Parse defensively: an error body must never be treated as success.
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const ok = Boolean((payload as { ok?: unknown } | null)?.ok);
    if (response.ok && ok) {
      return { ok: true };
    }

    const reason = (payload as { reason?: unknown } | null)?.reason;
    if (reason === 'invalid_email' || reason === 'rate_limited') {
      return { ok: false, reason };
    }
    return { ok: false, reason: 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
