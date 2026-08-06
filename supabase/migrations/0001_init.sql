-- Kaafilla schema + RLS. Encodes the gating matrix:
--   public: operators, trips, plans, itineraries, reviews, explore_*
--   verified-only + scoped: profiles(social read), waitlist, connects, chats,
--     messages, looking_posts, expenses, settlements, safety_settings.

-- ── identity ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  age int,
  city text,
  work text,
  bio text,
  instagram text,
  lead text check (lead in ('women','men')),
  is_verified boolean not null default false,
  verification_status text not null default 'none' check (verification_status in ('none','pending','verified')),
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  slot int not null check (slot between 1 and 3)
);

-- verification record card (from Aadhaar; number/scan/photo never stored)
create table public.verifications (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  record_name text,
  gender text,
  age int,
  face_match text,
  verified_at timestamptz not null default now()
);

-- ── catalog (public read) ──────────────────────────────────────────────────
create table public.operators (id text primary key, name text not null, since int);

create table public.trips (
  id text primary key, name text not null, place text, region text,
  price int, days int, type text, women_pct int, rating numeric(2,1),
  stay text, difficulty text, month text, group_size int, waitlist int,
  operators int, operator_id text references public.operators(id),
  lead_name text, lead text, lead_years int, cities text
);

create table public.plans (
  id text primary key, name text not null, place text, region text,
  cost_each int, days int, month text, stay text, group_size int, joined int,
  host_name text, host_id text, lead text, host_trips int, host_rating numeric(2,1),
  dates text check (dates in ('flexible','fixed')), cities text, note text
);

create table public.itineraries (
  trip_id text references public.trips(id) on delete cascade,
  idx int, line text, primary key (trip_id, idx)
);

create table public.reviews (
  id text primary key, operator_id text references public.operators(id),
  name text, stars int, when_label text, text text
);

create table public.explore_regions (
  key text primary key, base text, sub text, per_day int, know text[]
);
create table public.explore_places (
  id uuid primary key default gen_random_uuid(),
  region text references public.explore_regions(key) on delete cascade,
  category text check (category in ('famous','food','gems','shops')),
  name text, meta text, descr text, added_by text, status text
);

-- ── waitlist + wallet ──────────────────────────────────────────────────────
create table public.wallets (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  balance int not null default 0
);
create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null, reason text, created_at timestamptz not null default now()
);
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id text, profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  has_priority boolean not null default false,
  priority_source text,  -- 'cash' | 'wallet' | null
  status text not null default 'pending'
    check (status in ('pending','confirmed','forfeit','missed')),
  called_at timestamptz,  -- when the seat was offered (starts the 24h window)
  unique (trip_id, profile_id)
);

-- ── social: connects, chats, messages, looking board ───────────────────────
create table public.connects (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (from_id, to_id)
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('solo','group')),
  trip_ref text, created_at timestamptz not null default now(),
  archived_at timestamptz
);
create table public.chat_members (
  chat_id uuid references public.chats(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  primary key (chat_id, profile_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null, relay_hops int, created_at timestamptz not null default now()
);

create table public.looking_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  where_text text, when_text text, one_line text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

-- ── settlement ledger ──────────────────────────────────────────────────────
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_ref text not null, payer_id uuid not null references public.profiles(id),
  label text, amount int, created_at timestamptz not null default now()
);
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_ref text not null,
  from_id uuid not null references public.profiles(id),
  to_id uuid not null references public.profiles(id),
  amount int, from_confirmed boolean not null default false,
  to_confirmed boolean not null default false, cleared_at timestamptz
);

create table public.safety_settings (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  handle_visibility text not null default 'women_and_connects',
  check_in_contact uuid
);

-- ── helpers (defined after tables exist; used by RLS below) ─────────────────
create or replace function public.is_verified(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_verified from public.profiles where id = uid), false);
$$;

create or replace function public.me() returns uuid language sql stable as $$
  select auth.uid();
$$;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.photos           enable row level security;
alter table public.verifications    enable row level security;
alter table public.wallets          enable row level security;
alter table public.wallet_ledger    enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.connects         enable row level security;
alter table public.chats            enable row level security;
alter table public.chat_members     enable row level security;
alter table public.messages         enable row level security;
alter table public.looking_posts    enable row level security;
alter table public.expenses         enable row level security;
alter table public.settlements      enable row level security;
alter table public.safety_settings  enable row level security;

-- Catalog tables: public read, no writes from clients.
alter table public.operators        enable row level security;
alter table public.trips            enable row level security;
alter table public.plans            enable row level security;
alter table public.itineraries      enable row level security;
alter table public.reviews          enable row level security;
alter table public.explore_regions  enable row level security;
alter table public.explore_places   enable row level security;
do $$ declare tbl text;
begin
  foreach tbl in array array['operators','trips','plans','itineraries','reviews','explore_regions','explore_places']
  loop
    execute format('create policy %I_read on public.%I for select using (true);', tbl, tbl);
  end loop;
end $$;

-- profiles: self always; others only when BOTH viewer and target are verified.
create policy profiles_self on public.profiles for select using (id = me());
create policy profiles_verified on public.profiles for select
  using (is_verified(me()) and is_verified);
create policy profiles_upsert_self on public.profiles for insert with check (id = me());
create policy profiles_update_self on public.profiles for update using (id = me());

-- photos: readable if the owning profile is readable (self or both verified).
create policy photos_read on public.photos for select
  using (profile_id = me() or (is_verified(me()) and is_verified(profile_id)));
create policy photos_write_self on public.photos for all
  using (profile_id = me()) with check (profile_id = me());

create policy verif_self on public.verifications for select using (profile_id = me());

-- wallet: owner only.
create policy wallet_self on public.wallets for select using (profile_id = me());
create policy ledger_self on public.wallet_ledger for select using (profile_id = me());

-- waitlist: verified; you see entries on trips you're on (queue), you write your own.
create policy wl_self on public.waitlist_entries for select
  using (is_verified(me()) and (profile_id = me()
    or trip_id in (select trip_id from public.waitlist_entries where profile_id = me())));
create policy wl_insert on public.waitlist_entries for insert
  with check (is_verified(me()) and profile_id = me());

-- connects: verified; you see connects you sent or received.
create policy connects_mine on public.connects for select
  using (is_verified(me()) and (from_id = me() or to_id = me()));
create policy connects_send on public.connects for insert
  with check (is_verified(me()) and from_id = me());
create policy connects_respond on public.connects for update using (to_id = me());

-- chats/messages: members only, and verified.
create policy chat_member_read on public.chats for select
  using (is_verified(me()) and id in (select chat_id from public.chat_members where profile_id = me()));
create policy chat_members_read on public.chat_members for select
  using (chat_id in (select chat_id from public.chat_members where profile_id = me()));
create policy messages_read on public.messages for select
  using (chat_id in (select chat_id from public.chat_members where profile_id = me()));
create policy messages_send on public.messages for insert
  with check (sender_id = me()
    and chat_id in (select chat_id from public.chat_members where profile_id = me()));

-- looking board: verified read/write; own posts editable.
create policy looking_read on public.looking_posts for select using (is_verified(me()));
create policy looking_write on public.looking_posts for insert
  with check (is_verified(me()) and profile_id = me());
create policy looking_edit on public.looking_posts for update using (profile_id = me());

-- settlement ledger: participants of the trip_ref.
create policy expenses_party on public.expenses for select using (is_verified(me()));
create policy settlements_party on public.settlements for select
  using (is_verified(me()) and (from_id = me() or to_id = me()));

create policy safety_self on public.safety_settings for all
  using (profile_id = me()) with check (profile_id = me());

-- ── grants (RLS filters rows; roles still need table privileges) ────────────
grant usage on schema public to anon, authenticated;
grant select on
  public.operators, public.trips, public.plans, public.itineraries,
  public.reviews, public.explore_regions, public.explore_places
  to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.photos, public.verifications, public.wallets,
  public.wallet_ledger, public.waitlist_entries, public.connects, public.chats,
  public.chat_members, public.messages, public.looking_posts, public.expenses,
  public.settlements, public.safety_settings
  to authenticated;

-- New auth user → empty profile + wallet.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.wallets (profile_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
