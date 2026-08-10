# Gender-check Edge Function setup

The soft photo/gender check runs **server-side** so a client can't forge a
`match` and the gender-model API key never ships in the app bundle. Three pieces:

1. **`services/gender-detect/`** — the Flask + OpenCV gender model, deployed as a
   Docker web service (e.g. Render). Auth'd by an `X-Api-Key` header. See its README.
2. **`supabase/functions/gender-check/index.ts`** — the Edge Function. It reads the
   caller's declared gender (`profiles.lead`) + first photo from the DB, calls the
   model with a server-held key, and writes `gender_check` / `detected_gender` with
   the service role.
3. **`supabase/stage15-gender-check-server-only.sql`** — a trigger that forbids the
   owner from writing `gender_check` / `detected_gender` (the appeal
   `needs_review → appealed` is the only owner change allowed).

## Deploy

1. **Apply the migration** — paste `stage15-gender-check-server-only.sql` into the
   Studio SQL Editor and run it (depends on stage13 + stage14).

2. **Deploy the function** — Dashboard → Edge Functions → Deploy new function →
   name it **`gender-check`** → paste `functions/gender-check/index.ts`. Keep
   **Verify JWT = ON** (callers send their user token).

3. **Set the secrets** (the model URL + key — Edge Function env, not the bundle):
   ```bash
   supabase secrets set GENDER_API_URL=https://<your-service>.onrender.com GENDER_API_KEY=<key>
   ```
   Or Dashboard → Edge Functions → Manage secrets. `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

If the function isn't deployed (or the secrets are unset) the check simply
no-ops — `gender_check` stays `unchecked` and onboarding is unaffected.

## Reviewer workflow (no admin UI yet)

The function only ever writes `match` or `needs_review`, and never hard-blocks.
A human clears an appeal as the service role in Studio:

```sql
-- approve (photo is right):
update public.profiles set gender_check = 'match' where id = '<uuid>';
-- reject (send back so the user must correct it):
update public.profiles set gender_check = 'needs_review' where id = '<uuid>';
```
