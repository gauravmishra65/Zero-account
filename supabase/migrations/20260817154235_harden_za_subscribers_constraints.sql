/*
# Harden ZA_subscribers input constraints

## Plain-English explanation
The newsletter signup table previously accepted any text at all as an email
address, of any length, with any "source" label, and treated addresses that
differ only by capitalisation as different people. All four of those checks
existed only in the website's own code, which does not protect the database
because anyone can send a request directly to the API without using the
website. This migration moves those checks into the database itself, where
they always apply.

## Modified Tables
- `za_subscribers` (no columns added, removed, or retyped; no data destroyed)
  - NEW CHECK `za_subscribers_email_len`: email must be 3-254 characters.
    254 is the maximum forward-path length in RFC 5321. This prevents a single
    request from storing an unbounded amount of text.
  - NEW CHECK `za_subscribers_email_shape`: email must match a basic address
    shape (local part, single @, domain with a dot, no whitespace).
  - NEW CHECK `za_subscribers_source_allowed`: source must be one of a small
    known set of site labels, so the attribution field cannot be set to
    arbitrary attacker-supplied text.
  - NEW UNIQUE INDEX `za_subscribers_email_lower_key` on `lower(email)`:
    makes address uniqueness case-insensitive, so `A@x.com` and `a@x.com`
    can no longer both be stored as separate subscribers.

## Security changes
- No change to RLS or to any policy in this migration.
- These are input-validation constraints only. They reject malformed writes;
  they do not widen or narrow who may read or write the table.

## Important notes

1. EXISTING DATA
   The constraints are added NOT VALID first and then validated, so the
   migration cannot fail on pre-existing rows. If any legacy row violates a
   constraint, the constraint stays enforced for all NEW writes while the
   old row is left untouched. No existing data is deleted or modified.

2. CASE-INSENSITIVE UNIQUENESS
   The original `UNIQUE (email)` constraint is intentionally LEFT IN PLACE.
   The new functional unique index on `lower(email)` is strictly stronger, so
   keeping both is safe and avoids dropping an existing constraint.

3. IDEMPOTENCY
   Every statement is guarded so the migration can be re-applied safely.
*/

-- Email length bound (F3) -------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.za_subscribers'::regclass
      AND conname = 'za_subscribers_email_len'
  ) THEN
    ALTER TABLE public.za_subscribers
      ADD CONSTRAINT za_subscribers_email_len
      CHECK (char_length(email) BETWEEN 3 AND 254) NOT VALID;
  END IF;
END $$;

-- Email shape (F2) --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.za_subscribers'::regclass
      AND conname = 'za_subscribers_email_shape'
  ) THEN
    ALTER TABLE public.za_subscribers
      ADD CONSTRAINT za_subscribers_email_shape
      CHECK (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') NOT VALID;
  END IF;
END $$;

-- Source allowlist (F5) ---------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.za_subscribers'::regclass
      AND conname = 'za_subscribers_source_allowed'
  ) THEN
    ALTER TABLE public.za_subscribers
      ADD CONSTRAINT za_subscribers_source_allowed
      CHECK (source IN ('zero_account_site', 'shadow_code_site', 'author_site')) NOT VALID;
  END IF;
END $$;

-- Validate the new constraints without failing on legacy rows -------------
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.za_subscribers VALIDATE CONSTRAINT za_subscribers_email_len;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'za_subscribers_email_len left NOT VALID (pre-existing rows violate it)';
  END;

  BEGIN
    ALTER TABLE public.za_subscribers VALIDATE CONSTRAINT za_subscribers_email_shape;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'za_subscribers_email_shape left NOT VALID (pre-existing rows violate it)';
  END;

  BEGIN
    ALTER TABLE public.za_subscribers VALIDATE CONSTRAINT za_subscribers_source_allowed;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'za_subscribers_source_allowed left NOT VALID (pre-existing rows violate it)';
  END;
END $$;

-- Case-insensitive uniqueness (F6) ----------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS za_subscribers_email_lower_key
  ON public.za_subscribers (lower(email));
