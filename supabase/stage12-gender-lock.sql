-- stage12: lock the declared gender (profiles.lead) once it is set.
--
-- Gender drives safety-sensitive gating (women-only spaces, the trip ratio,
-- women-led listings), so a user must not be able to flip it after the fact.
-- The app UI also locks it, but that is cosmetic — this trigger is the real,
-- tamper-proof guard at the database level.
--
-- Behaviour:
--   * lead starts NULL; the user may set it ONCE (onboarding / first edit).
--   * once non-NULL, the row owner can no longer change or clear it.
--   * a support/admin change made under the service role (auth.uid() IS NULL)
--     is still allowed, so a genuine correction is possible via review.
--
-- The profiles.lead column already exists (apply-to-hosted.sql) with
--   check (lead in ('women','men')), so no column change is needed.

create or replace function public.lock_profile_lead()
returns trigger
language plpgsql
as $$
begin
  if old.lead is not null
     and new.lead is distinct from old.lead
     and auth.uid() = old.id then
    raise exception 'gender is locked once set; contact support to change it'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lock_profile_lead on public.profiles;

create trigger trg_lock_profile_lead
  before update on public.profiles
  for each row
  execute function public.lock_profile_lead();
