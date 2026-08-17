/*
# Close the direct browser write path to za_subscribers

## Plain-English explanation
Signups now go through a server-side gatekeeper that checks the email address,
sets the source label itself, and limits how many signups one visitor can make.
That gatekeeper is only useful if it cannot be walked around. Previously the
browser could write to the subscriber list directly, bypassing all of those
checks. This migration removes that direct path, so the gatekeeper is the only
way a row can be added.

## Security changes
- DROPPED policy `anon_insert_subscribers` on `za_subscribers`. The browser
  roles no longer have any policy on this table, so with RLS enabled they are
  denied every operation.
- REVOKED all table privileges on `za_subscribers` from `anon` and
  `authenticated`. These roles previously held SELECT/INSERT/UPDATE/DELETE
  grants. The read/update/delete grants were already inert because no policy
  permitted them, but revoking them removes the standing grant entirely as
  defence in depth.
- The server-side signup function uses the service role, which bypasses RLS,
  so it is unaffected and remains the single write path.

## Important notes

1. NO DATA LOSS
   This migration changes permissions only. No table, column, or row is
   dropped or modified.

2. THE SUBSCRIBER LIST STAYS PRIVATE
   There is still no SELECT policy and no SELECT grant for the browser roles,
   so the mailing list cannot be read from the website. The author reads it
   through the Supabase dashboard, which uses a privileged connection.

3. RLS REMAINS ENABLED
   `za_subscribers` keeps row level security enabled with zero policies, which
   is a deny-all posture for every browser role.
*/

DROP POLICY IF EXISTS "anon_insert_subscribers" ON public.za_subscribers;

REVOKE ALL ON public.za_subscribers FROM anon;
REVOKE ALL ON public.za_subscribers FROM authenticated;
