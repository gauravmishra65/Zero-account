/*
# Create ZA_subscribers table (newsletter / clearance requests)

## Purpose
Stores email signups from the ZERO-ACCOUNT.com "REQUEST CLEARANCE" form.
This is the book-specific companion site to authorgaurav.com.

## New Tables
- `ZA_subscribers`
  - `id`          uuid, primary key, default gen_random_uuid()
  - `email`       text, not null, unique (one signup per email)
  - `source`      text, not null, default 'zero_account_site'
  - `created_at`  timestamptz, default now()

## Security
- Row Level Security ENABLED.
- INSERT-only policy for anon + authenticated: the public can submit an email,
  but no one can read, update, or delete rows from the client. There is
  intentionally NO SELECT / UPDATE / DELETE policy — this table is insert-only
  from the frontend by design. Duplicate emails are rejected by the unique
  constraint and handled gracefully in the UI.

## Notes
- `id` and `created_at` are generated automatically; the frontend only sends
  `email` and `source`.
- Do not add a SELECT policy. The site never reads from this table client-side.
*/

CREATE TABLE IF NOT EXISTS ZA_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'zero_account_site',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ZA_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_subscribers" ON ZA_subscribers;
CREATE POLICY "anon_insert_subscribers"
  ON ZA_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
