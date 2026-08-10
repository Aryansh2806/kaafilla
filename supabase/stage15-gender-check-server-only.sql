-- stage15: make the photo/gender check server-authoritative.
--
-- Before this, the client computed 'match'/'needs_review' and wrote gender_check
-- itself — so a user could just POST their own 'match'. Now the `gender-check`
-- Edge Function does the write with the service role, and this trigger forbids
-- the OWNER from touching gender_check / detected_gender directly. The one owner
-- change still allowed is the APPEAL (needs_review -> appealed), which only asks
-- for a human review and grants nothing. Service role (auth.uid() IS NULL, i.e.
-- the Edge Function or a Studio/reviewer action) bypasses it all.
--
-- Depends on: stage13, stage14. Safe to re-run.

create or replace function public.guard_gender_check()
returns trigger
language plpgsql
as $$
begin
  -- Service role / server has no auth.uid() → allowed. Cross-user writes are
  -- already blocked by the profiles RLS policy, so only guard the owner.
  if auth.uid() is null or auth.uid() <> old.id then
    return new;
  end if;

  -- detected_gender is the model's guess — server-written only.
  if new.detected_gender is distinct from old.detected_gender then
    raise exception 'detected_gender is set by the server only'
      using errcode = 'check_violation';
  end if;

  -- gender_check is server-written, except the owner may appeal a review.
  if new.gender_check is distinct from old.gender_check
     and not (coalesce(old.gender_check, 'unchecked') = 'needs_review'
              and new.gender_check = 'appealed') then
    raise exception 'gender_check is set by the server; you may only appeal a review'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_gender_check on public.profiles;
create trigger trg_guard_gender_check
  before update on public.profiles
  for each row execute function public.guard_gender_check();
