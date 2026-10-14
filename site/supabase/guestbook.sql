-- Guestbook table for the site (lib/guestbook.ts talks to it over REST).
--
-- One-time setup:
--   1. Create a free project at https://supabase.com.
--   2. Open SQL Editor → New query, paste this whole file and run it.
--      It is safe to run again.
--   3. Project Settings → API: copy the Project URL and the anon (or
--      publishable) key into the site's environment as
--        NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
--      (for GitHub Pages: repository Settings → Secrets and variables →
--      Actions, then pass them to the build step).
--   4. Rebuild. The guestbook switches on by itself.
--
-- Visitors can read every entry and add new ones. Nobody can edit or
-- delete through the public key; remove spam from the Supabase dashboard
-- (Table Editor) or with the service role.

create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  -- Compact SVG path data from the signature pad: only M, L and Q
  -- commands, numbers, spaces, dots and minus signs.
  signature text not null,
  created_at timestamptz not null default now(),

  constraint guestbook_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint guestbook_message_length check (char_length(btrim(message)) between 1 and 120),
  constraint guestbook_signature_length check (char_length(signature) between 1 and 20000),
  constraint guestbook_signature_format check (signature ~ '^[MLQ0-9 .-]+$')
);

comment on table public.guestbook is 'Signed notes from visitors of arsher.is-a.dev';

-- Newest-first listing.
create index if not exists guestbook_created_at_idx on public.guestbook (created_at desc);

-- Row level security: on, with only the two policies below.
alter table public.guestbook enable row level security;

-- Table privileges. The public roles may read, and may insert only the
-- three visitor fields (id and created_at always come from the defaults).
-- No update, delete or truncate.
revoke all on table public.guestbook from anon, authenticated;
grant select on table public.guestbook to anon, authenticated;
grant insert (name, message, signature) on table public.guestbook to anon, authenticated;

drop policy if exists "Anyone can read the guestbook" on public.guestbook;
create policy "Anyone can read the guestbook"
  on public.guestbook
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can sign the guestbook" on public.guestbook;
create policy "Anyone can sign the guestbook"
  on public.guestbook
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 40
    and char_length(btrim(message)) between 1 and 120
    and char_length(signature) between 1 and 20000
  );

-- No update or delete policies: with RLS on, those are refused for
-- everyone except the service role.
