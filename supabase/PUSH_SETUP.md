# Push notifications setup (feature #6)

Connects & messages fire a push even when the app is closed. The code is fully
wired and **inert until the steps below are done** — pre-setup it no-ops (you'll
see one dev warning: `[push] native module not in build yet`), never crashes.

## What's already in the repo

- Client: `src/notifications/` — token registration, tap→navigate, sign-out cleanup.
  Mounted in `RootNavigator` via `usePushNotifications(user.id)`.
- `app.json`: the `expo-notifications` config plugin.
- DB: `supabase/stage7-push-tokens.sql` — `device_push_tokens` table + RLS.
- Server: `supabase/functions/notify-push/index.ts` — the Expo push sender.
- Webhooks: `supabase/webhooks-notify-push.sql` — triggers that call the function.

## One-time setup

### 1. Firebase Cloud Messaging (required for Android remote push)
1. Create a Firebase project → add an Android app with package `com.anonymous.kaafilla`.
2. Download `google-services.json` into the project root and reference it in
   `app.json` under `android.googleServicesFile` (or let EAS manage it).
3. Create an **EAS project**: `npx eas init` (adds `extra.eas.projectId` to app.json —
   the client reads this to mint the push token).
4. Upload the FCM **V1 service account key** to Expo:
   `npx eas credentials` → Android → Push Notifications (FCM V1). This is what lets
   Expo's push service deliver to Android.

### 2. Database
Paste `supabase/stage7-push-tokens.sql` into the Studio SQL editor and run it.

> **Check this even if you think it's done.** As of 2026-08 the hosted project
> did **not** have `device_push_tokens` — stage7 had never been applied there, so
> the client had nowhere to store a token and the function had nothing to look
> up. Verify with:
> `select count(*) from public.device_push_tokens;` — an error means run stage7.

### 3. Edge Function (no CLI needed)
1. Supabase Dashboard → Edge Functions → **Deploy a new function** → name `notify-push`
   → paste `supabase/functions/notify-push/index.ts`.
2. Turn **Verify JWT = OFF** for it (we auth with a shared secret instead).
3. Add a function **secret** `WEBHOOK_SECRET` = any random string.
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

### 4. Webhooks
Edit `supabase/webhooks-notify-push.sql`: replace `<PROJECT_REF>` and
`<WEBHOOK_SECRET>`, then run it in the Studio SQL editor.

### 5. Rebuild the app
`expo-notifications`/`expo-device` are native modules → a JS reload isn't enough:
```
npx expo run:android
```
(JDK 17, per CLAUDE.md.) On first launch after the rebuild, grant the notification
permission prompt.

## Verify
Sign in on two devices (or one device + a Studio insert). Send a connect or a
message from A → B with B's app **closed**. B should get a banner; tapping a
message opens the 1:1 room, a connect opens the Chats tab.

**Operator notifications** (stage20) ride the same function and webhook file.
The quickest check needs no second device — insert one row as the service role
and watch the phone:

```sql
insert into public.notifications (profile_id, kind, title, body, data)
select id, 'seat_called', 'Your seat is ready',
       'A seat opened on your trip — you have 24 hours to confirm.', '{}'::jsonb
from public.profiles where first_name = '<your test user>';
```

The row also appears in the app's Activity screen immediately (it is realtime),
so if Activity updates but no banner arrives, the gap is push delivery — check
the Edge Function logs for `{ sent: 0 }`, which means the recipient has no token.

Debug: Edge Function logs (Dashboard) show `{ sent: N }`; `device_push_tokens`
should have a row per signed-in device. If `sent: 0`, the recipient has no token
(permission denied, or app not opened since setup).
