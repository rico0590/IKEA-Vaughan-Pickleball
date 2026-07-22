-- ============================================================
-- IKEA Vaughan Pickleball — Supabase setup
-- Paste this whole file into Supabase's SQL Editor and click Run.
-- It creates one table to hold all the club's shared data.
-- ============================================================

-- 1. The table: a simple key -> value store.
--    key   = "accounts" | "sessions" | "matches" | "gallery"
--    value = the list of items, stored as JSON
create table if not exists club_data (
  key   text primary key,
  value jsonb not null default '[]'::jsonb
);

-- 2. Turn on row level security (required by Supabase).
alter table club_data enable row level security;

-- 3. Allow the app to read and write this table.
--    NOTE: this is open access, which suits a small casual club where
--    the whole point is that everyone shares one board. It is NOT
--    private — anyone with your site URL can read/write club_data.
--    Good enough for pickleball; do not store anything sensitive.
create policy "public read"  on club_data for select using (true);
create policy "public write" on club_data for insert with check (true);
create policy "public update" on club_data for update using (true);

-- 4. Seed the four empty lists so the app has something to read.
insert into club_data (key, value) values
  ('accounts', '[]'::jsonb),
  ('sessions', '[]'::jsonb),
  ('matches',  '[]'::jsonb),
  ('gallery',  '[]'::jsonb)
on conflict (key) do nothing;
