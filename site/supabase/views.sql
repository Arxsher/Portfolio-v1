-- View counts for the project pages (lib/views.ts talks to it over REST).
--
-- One-time setup, in the same Supabase project as the guestbook: open
-- SQL Editor → New query, paste this whole file and run it. It is safe to
-- run again. Nothing else to configure: the site turns the counter on
-- whenever NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are
-- set (see README.md).
--
-- Visitors can read the counts and add one view at a time through
-- count_project_view(); they cannot write to the table directly.

create table if not exists public.project_views (
  slug text primary key,
  views bigint not null default 0,
  updated_at timestamptz not null default now(),

  constraint project_views_slug_format check (slug ~ '^[a-z0-9-]{1,80}$'),
  constraint project_views_positive check (views >= 0)
);

comment on table public.project_views is 'Page views of the project pages on arsher.is-a.dev';

alter table public.project_views enable row level security;

revoke all on table public.project_views from anon, authenticated;
grant select on table public.project_views to anon, authenticated;

drop policy if exists "Anyone can read view counts" on public.project_views;
create policy "Anyone can read view counts"
  on public.project_views
  for select
  to anon, authenticated
  using (true);

-- Adds one view and returns the new total. Runs with the owner's rights so
-- the public key never needs write access to the table.
create or replace function public.count_project_view(page_slug text)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.project_views as counts (slug, views)
  values (page_slug, 1)
  on conflict (slug) do update
    set views = counts.views + 1, updated_at = now()
  returning views;
$$;

revoke all on function public.count_project_view(text) from public;
grant execute on function public.count_project_view(text) to anon, authenticated;
