/*
# Atomic rate-limit claim for newsletter signups

1. Problem
   The signup handler previously counted recent attempts and THEN recorded its own
   attempt in two separate round trips. Requests arriving at the same moment all
   read a count below the limit before any of them had been recorded, so a burst
   of simultaneous requests could all be admitted instead of just the allowed few.

2. New Functions
   - `public.za_claim_subscribe_attempt(p_ip_hash text, p_max int, p_window_minutes int)`
     returns boolean. In ONE transaction it:
       a. deletes attempt rows older than the window (housekeeping),
       b. records the current attempt,
       c. counts the attempts for this visitor inside the window,
       d. returns true when the visitor is still within the limit, false otherwise.
     Because the attempt is recorded BEFORE the count is taken, two concurrent
     callers cannot both see a stale count: the claim and the check are the same
     transaction.

3. Security
   - The function is SECURITY DEFINER so it can write to `za_subscribe_attempts`,
     which has row level security enabled and deliberately no policies.
   - `search_path` is pinned to `public, pg_temp` so the body cannot be redirected
     through an attacker-controlled schema.
   - EXECUTE is revoked from PUBLIC, `anon` and `authenticated`, and granted ONLY to
     `service_role`. The browser cannot call it; only the server-side signup handler
     can, which is the same trust boundary as before.

4. Important notes
   1. No table, column or data is dropped or modified by this migration.
   2. The subscriber list remains unreachable from the browser: no grants and no
      policies were added to `za_subscribers` or `za_subscribe_attempts`.
   3. Re-running this migration is safe (CREATE OR REPLACE plus idempotent grants).
*/

CREATE OR REPLACE FUNCTION public.za_claim_subscribe_attempt(
  p_ip_hash text,
  p_max integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_ip_hash IS NULL OR length(p_ip_hash) = 0 THEN
    RETURN false;
  END IF;

  IF p_max IS NULL OR p_max < 1 THEN
    p_max := 5;
  END IF;

  IF p_window_minutes IS NULL OR p_window_minutes < 1 THEN
    p_window_minutes := 10;
  END IF;

  v_window_start := now() - make_interval(mins => p_window_minutes);

  -- Housekeeping: drop attempts that can no longer affect any window.
  DELETE FROM public.za_subscribe_attempts
  WHERE created_at < v_window_start;

  -- Claim FIRST, then measure. This is what makes the check atomic.
  INSERT INTO public.za_subscribe_attempts (ip_hash)
  VALUES (p_ip_hash);

  SELECT count(*) INTO v_count
  FROM public.za_subscribe_attempts
  WHERE ip_hash = p_ip_hash
    AND created_at >= v_window_start;

  RETURN v_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.za_claim_subscribe_attempt(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.za_claim_subscribe_attempt(text, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.za_claim_subscribe_attempt(text, integer, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.za_claim_subscribe_attempt(text, integer, integer) TO service_role;

CREATE INDEX IF NOT EXISTS za_subscribe_attempts_ip_window_idx
  ON public.za_subscribe_attempts (ip_hash, created_at DESC);
