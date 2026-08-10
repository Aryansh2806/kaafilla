-- stage13: store the soft photo/gender consistency check.
--
-- The onboarding flow runs a face-based gender signal (services/gender-detect)
-- against the user's declared gender. This is a *soft* check: a disagreement is
-- flagged for human review, never an automatic rejection — the model is biased
-- and unreliable, so it must not gate account creation on its own.
--
--   gender_check:   'unchecked'    -> not run / service unconfigured / no face
--                   'match'        -> photo signal agreed with the declared gender
--                   'needs_review' -> disagreed; a human should look
--   detected_gender: what the photo model returned (for the reviewer), or null.
--
-- Depends on: apply-to-hosted.sql (profiles). Safe to re-run.

alter table public.profiles
  add column if not exists gender_check text not null default 'unchecked'
    check (gender_check in ('unchecked', 'match', 'needs_review')),
  add column if not exists detected_gender text
    check (detected_gender in ('women', 'men'));

-- Production hardening (not enforced here): the detection call + this write
-- should run in an Edge Function under the service role so a user can't forge
-- 'match'. Today it is written client-side, matching the simulated-KYC posture
-- (see src/api/auth.ts saveGenderCheck and services/gender-detect/README.md).
