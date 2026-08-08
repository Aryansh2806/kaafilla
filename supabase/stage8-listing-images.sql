-- Real listing photos (feature #7). Operators/hosts supply their own images
-- instead of the client-side placeholder map in src/data/tripImages.ts.
--
-- `images` is an ordered array of public URLs; images[0] is the cover. The app
-- prefers these when present and falls back to the placeholder map otherwise, so
-- existing rows with an empty array keep working.
--
-- Apply in the Supabase Studio SQL editor.

alter table public.trips add column if not exists images text[] not null default '{}';
alter table public.plans add column if not exists images text[] not null default '{}';

-- Public 'listings' Storage bucket. Files live under <uid>/... so a host can only
-- write their own; anyone can read (listings are public per the gating matrix).
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

drop policy if exists "listings_public_read" on storage.objects;
create policy "listings_public_read" on storage.objects for select
  using (bucket_id = 'listings');

drop policy if exists "listings_insert_own" on storage.objects;
create policy "listings_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "listings_update_own" on storage.objects;
create policy "listings_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "listings_delete_own" on storage.objects;
create policy "listings_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);
