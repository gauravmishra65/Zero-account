/*
# Create signup attempt log for rate limiting

## Plain-English explanation
Previously anyone could send unlimited signup requests straight to the
database, which meant a single person could fill the author's mailing list
with millions of fake entries. To stop that, signups now go through a small
server-side gatekeeper that counts how many attempts have come from each
visitor recently. This table is where those counts are kept.

It has to be a real table rather than kept in memory, because the gatekeeper
runs on many short-lived server instances that do not share memory with one
another — an in-memory counter would reset constantly and enforce nothing.

## New Tables
- `za_subscribe_attempts`
  - `id`          uuid, primary key, default gen_random_uuid()
  - `ip_hash`     text, not null — a one-way hash of the requester's IP.
                  Hashed rather than stored raw so the table holds no
                  directly identifying network data.
  - `created_at`  timestamptz, not null, default now()

## Security changes
- RLS ENABLED on `za_subscribe_attempts`.
- DELIBERATELY NO POLICIES AT ALL. With RLS on and zero policies, the browser
  roles (`anon`, `authenticated`) are denied every operation. Only the
  service role, which bypasses RLS and is held exclusively by the server-side
  signup function, can read or write this table. The rate limit therefore
  cannot be read, cleared, or tampered with from a browser.
- Table-level privileges are additionally revoked from `anon` and
  `authenticated` as defence in depth.

## Important notes

1. INDEX
   `za_subscribe_attempts_ip_time_idx` on (`ip_hash`, `created_at` DESC)
   keeps the per-visitor lookback query fast as the log grows.

2. HOUSEKEEPING
   Rows older than the rate-limit window are pruned opportunistically by the
   signup function on each call, so this table stays small on its own.
*/

CREATE TABLE IF NOT EXISTS public.za_subscribe_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.za_subscribe_attempts ENABLE ROW LEVEL SECURITY;

-- No policies by design: only the service role (server-side) may touch this.
REVOKE ALL ON public.za_subscribe_attempts FROM anon;
REVOKE ALL ON public.za_subscribe_attempts FROM authenticated;

CREATE INDEX IF NOT EXISTS za_subscribe_attempts_ip_time_idx
  ON public.za_subscribe_attempts (ip_hash, created_at DESC);
