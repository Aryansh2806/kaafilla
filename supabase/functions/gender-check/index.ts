// Edge Function: gender-check
//
// Server-authoritative soft photo/gender check. The client used to call the
// gender model directly and write profiles.gender_check itself — which meant a
// user could POST their own 'match' and the API key rode in the app bundle.
// This function closes both holes:
//   * it reads the caller's DECLARED gender (profiles.lead) and their first
//     photo straight from the DB, so the client can't lie about either;
//   * it calls the gender model with a server-held key (GENDER_API_URL /
//     GENDER_API_KEY — Edge Function secrets, never shipped to the client);
//   * it writes gender_check / detected_gender with the SERVICE ROLE, and
//     stage15's trigger forbids the owner from writing those columns — so
//     'match' is unforgeable.
//
// Still SOFT: a mismatch flags for review, never hard-blocks. A missing key,
// no face, or an unreachable service all resolve to the caller's current state
// (no write), so onboarding is never blocked by it.
//
// Deploy: Dashboard → Edge Functions → Deploy new function → name `gender-check`
// → paste this file. Keep Verify JWT = ON. Set the two secrets:
//   supabase secrets set GENDER_API_URL=https://<svc>.onrender.com GENDER_API_KEY=<key>
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GENDER_API_URL = Deno.env.get('GENDER_API_URL') ?? '';
const GENDER_API_KEY = Deno.env.get('GENDER_API_KEY') ?? '';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

type Lead = 'women' | 'men';

// Ask the gender model about a photo. Returns null on no-key / no-face / any
// error — every one of which the caller treats as "leave it unchecked".
async function detect(imageUrl: string): Promise<Lead | null> {
  if (!GENDER_API_URL || !imageUrl) return null;
  try {
    const res = await fetch(`${GENDER_API_URL.replace(/\/+$/, '')}/detect-gender`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GENDER_API_KEY ? { 'X-Api-Key': GENDER_API_KEY } : {}),
      },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.gender === 'women' || data?.gender === 'men' ? data.gender : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    // Identify the caller from their JWT.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'not signed in' }, 401);
    const uid = user.id;

    // Read the declared gender + current check straight from the DB (source of truth).
    const { data: prof } = await admin
      .from('profiles')
      .select('lead, gender_check')
      .eq('id', uid)
      .maybeSingle();
    const declared = (prof?.lead ?? null) as Lead | null;
    const current = (prof?.gender_check ?? 'unchecked') as string;
    if (!declared) return json({ ok: true, check: current, detected: null }); // nothing to check yet

    // First photo (slot 1) — also from the DB, not from the request.
    const { data: photoRow } = await admin
      .from('photos')
      .select('url')
      .eq('profile_id', uid)
      .order('slot')
      .limit(1)
      .maybeSingle();
    const photo = photoRow?.url as string | undefined;
    if (!photo) return json({ ok: true, check: current, detected: null });

    const detected = await detect(photo);
    if (!detected) return json({ ok: true, check: current, detected: null }); // no-face / unreachable → unchanged

    const check = detected === declared ? 'match' : 'needs_review';
    await admin.from('profiles').update({ gender_check: check, detected_gender: detected }).eq('id', uid);
    return json({ ok: true, check, detected });
  } catch (e) {
    console.error('[gender-check] error', e);
    return json({ error: String(e) }, 500);
  }
});
