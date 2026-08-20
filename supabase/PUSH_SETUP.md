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

Delivery path: **portal/app writes a row → webhook → notify-push → Expo push
service → FCM → the phone.** Expo needs YOUR FCM credentials to hand the
message to Google; that is the only reason Firebase is involved.

Status in this repo (verified 2026-08): `expo-notifications` + `expo-device` are
installed, the `expo-notifications` plugin is already in `app.json`, the Android
package is `com.anonymous.kaafilla`, and `eas.json` exists. What is missing is
the **Firebase project**, `google-services.json`, and `extra.eas.projectId`.

#### 1a. Create the Firebase project
1. <https://console.firebase.google.com> → **Add project** → name it (e.g.
   `kaafilla`) → Google Analytics is optional, disable it if unsure → Create.
2. On the project overview click the **Android** icon ("Add app").
3. **Android package name** must be exactly `com.anonymous.kaafilla` — it must
   match `expo.android.package` in `app.json` or FCM silently never delivers.
   Nickname and debug SHA-1 can be skipped (SHA-1 is for Google Sign-In, not push).
4. **Download `google-services.json`** and put it in the project ROOT (next to
   `app.json`).
5. Skip the "add the SDK" Gradle steps — the Expo config plugin does that.

#### 1b. Point app.json at it
Add `googleServicesFile` inside the existing `expo.android` block:

```jsonc
"android": {
  "package": "com.anonymous.kaafilla",
  "googleServicesFile": "./google-services.json",
  // ...existing adaptiveIcon etc.
}
```

`google-services.json` is not a secret in the password sense, but it identifies
your Firebase project — keep it out of public forks. It IS required at build
time, so if the repo is private, committing it is the simplest option; otherwise
add it to `.gitignore` and let EAS manage it as a build secret.

#### 1c. Create the EAS project
```bash
npx eas login      # a free Expo account is enough
npx eas init       # writes extra.eas.projectId into app.json
```
`extra.eas.projectId` is what `src/notifications/push.ts` reads to mint the
token — without it the client logs `[push] no EAS projectId yet` and skips
registration (by design, never crashes).

#### 1d. Give Expo your FCM credentials
Expo delivers to Android through FCM **V1**, which needs a Google service
account key:
1. Firebase Console → ⚙ **Project settings** → **Service accounts** →
   **Generate new private key** → downloads a `.json`.
   **Treat this like a password** — it can send push as you. Never commit it.
2. ```bash
   npx eas credentials
   ```
   → **Android** → your profile → **Push Notifications: Manage your FCM V1
   service account key** → **Upload a new service account key** → point it at
   that `.json`.
3. Verify it lists a configured FCM V1 key afterwards.

You can delete the downloaded key file once uploaded; Expo stores it.

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
