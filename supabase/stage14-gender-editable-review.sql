-- stage14: make gender editable while under review, and add the 'appealed' state.
--
-- UX fix: an honest mistake (or a wrong model guess) shouldn't lock someone out.
--   * While gender_check = 'needs_review', the owner may still change their gender
--     (the app re-runs the photo check on save — a corrected pick clears the flag).
--   * Once it's settled (match / unchecked / appealed) it locks again for the owner.
--   * A support/admin change (service role, auth.uid() IS NULL) is always allowed.
--
-- Supersedes the lock function from stage12-gender-lock.sql (CREATE OR REPLACE
-- updates it in place; the existing trigger keeps pointing at it).
-- Depends on: stage12, stage13. Safe to re-run.

create or replace function public.lock_profile_lead()
returns trigger
language plpgsql
as $$
begin
  if old.lead is not null
     and new.lead is distinct from old.lead
     and coalesce(old.gender_check, 'unchecked') <> 'needs_review'
     and auth.uid() = old.id then
    raise exception 'gender is locked; change it while under review, or contact support'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Allow the new 'appealed' value on gender_check.
alter table public.profiles drop constraint if exists profiles_gender_check_check;
alter table public.profiles add constraint profiles_gender_check_check
  check (gender_check in ('unchecked', 'match', 'needs_review', 'appealed'));

-- Reviewer workflow (no admin UI yet): to APPROVE an appeal, a human runs, as
-- the service role:
--   update public.profiles set gender_check = 'match' where id = '<uuid>';
-- To REJECT (send back so the user must correct it):
--   update public.profiles set gender_check = 'needs_review' where id = '<uuid>';
