# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

AGENTS.md above is the product/design bible (stack, gating matrix, ₹49 wallet economy, design tokens, folder map, component conventions) and is authoritative for **product rules and copy**. The notes below cover what AGENTS.md doesn't, and where the live backend has moved past its "what's simulated" section.

## Commands

- `npm install`
- `npx expo start` — Metro dev server (JS only). Physical devices connect over `adb reverse tcp:8081 tcp:8081`.
- `npx expo run:android` — build + install + run on Android. **Requires JDK 17** (see below). `expo run:ios` is macOS-only.
- `npx tsc --noEmit` — the only automated check; must stay clean before committing. **There is no test suite** (no jest/vitest) — don't look for one. `npm run typecheck` does not exist despite AGENTS.md mentioning it; use `tsc --noEmit`.
- Build one ABI directly (bypasses Expo's device picker, which ignores `ANDROID_SERIAL`):
  `cd android && ./gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a` (phone) or `x86_64` (emulator). `assembleRelease` bundles the JS in and runs standalone with no Metro (debug-keystore signed).

## Backend is live (supersedes AGENTS.md "what's simulated")

The app runs against a **hosted** Supabase project. `.env` (git-ignored) holds `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`; `hasBackend` in `src/api/client.ts` flips the app between live Supabase and the local `src/data/seed.ts` fallback. Auth is **email + password** (`signInOrSignUp`), not phone OTP — it needs Supabase "Confirm email" turned **off** so signup returns a session with no email step. Connects + 1:1 realtime chat are live (not client-side). Sessions persist in AsyncStorage; `RootNavigator` bootstraps the session and gates onboarding vs the app.

## API / data-flow architecture (spans several files)

Screens never call Supabase directly — they go through `src/api/` and its react-query hooks:

- `client.ts` — the single Supabase client + `hasBackend`.
- `catalog.ts` — **reads** (trips/plans/operators/reviews/itineraries/explore/people). Returns camelCase; falls back to seed when `!hasBackend`.
- `writes.ts` — `createPlan` (+ `inferRegion`: maps a free-text place → explore-region key so plans get photos).
- `social.ts` — connects + 1:1 chat (send/accept, `getOrCreateSoloChat`, messages).
- `auth.ts` — email/password, profile read/write, avatar upload to Storage, `markVerified`.
- `hooks.ts` — react-query wrappers; **screens use these, never the raw fns**.
- `src/hooks/useRealtimeSync.ts` — mounted once in `RootNavigator`; subscribes to `plans`/`profiles`/`connects` postgres_changes and invalidates the matching react-query keys. `ChatRoom` adds a per-chat `messages` subscription.

Verified-only gating is enforced twice: the `useVerifiedAction()` hook (UX) + Supabase RLS (server). RLS checks the DB `is_verified` flag — `markVerified()` must persist it, or the user looks verified locally but writes are blocked.

## Schema & RLS workflow (important)

Schema/migrations are applied **by hand in the Supabase Studio SQL Editor**, not via the CLI (`db push`/linking isn't set up, and we avoid handling the DB password). Applied in order: `supabase/migrations/0001_init.sql`, then `apply-to-hosted.sql`, `stage3.sql`, `stage4.sql`, `stage5-fix-chat-rls.sql`, `stage6-avatars-storage.sql`, `stage7-push-tokens.sql` (push notifications; see `PUSH_SETUP.md`), `stage8-listing-images.sql` (real listing photos: `images text[]` on trips/plans + `listings` bucket), `stage9-economy.sql` (server-authoritative ₹49 economy: tamper-proof RLS, `v_waitlist_ordered`, pg_cron seat expiry; deploy the `economy` Edge Function too — see `ECONOMY_SETUP.md`), `stage10-plan-joins.sql` (real plan-join requests: `plan_joins` table; accepting fires the ₹49 host charge via the economy `respond-join` action), `stage11-mesh-chat.sql` (Bluetooth-mesh chat reconciliation: `messages.client_id` for cross-transport dedup + `chat_mesh_keys` members-only per-chat secret; see `MESH_PLAN.md`). **When you change schema/policies, write a new `supabase/*.sql` and give the user the SQL to paste into Studio.**

Two RLS pitfalls this codebase already hit (don't reintroduce):
1. **No self-referential policies.** A policy whose `USING`/`WITH CHECK` selects from its own table causes `42P17 infinite recursion`. Use a `SECURITY DEFINER` helper (e.g. `is_chat_member(cid, uid)`).
2. **Never chain `.insert().select()`** on a table whose SELECT policy needs a related row that doesn't exist yet — e.g. inserting a chat with `.select()` runs the member-only SELECT policy on a chat that has no members → `42501`. Fix: generate the id client-side and insert without `.select()`.

To read the true stored value of a `SECURITY DEFINER` flag from outside the app, call it via RPC with the anon key (e.g. `POST /rest/v1/rpc/is_verified {uid}`).

## Images

Placeholder destination photos live in `src/data/tripImages.ts` (`heroImage`/`heroImages`, keyed by trip/plan id with a per-region fallback). Feed cards and detail heroes use `PhotoCarousel`; tapping a photo opens `FullscreenGallery` (pinch/pan/double-tap via reanimated + gesture-handler). All image rendering uses **`expo-image`** (`contentFit`/`transition`/`cachePolicy`), not RN `Image`. Real profile photos upload to the public `avatars` Storage bucket (`<uid>/N.jpg`); the `photos` table stores the public URLs.

## Native modules & the "inert until rebuild" pattern

Two features ship real native Android/Kotlin code, each behind a guarded JS seam so a JS-only build that predates the native rebuild stays alive (the seam reports "unsupported" instead of crashing):

- **`src/notifications/`** (push) — `expo-notifications` + `expo-device`, lazy-loaded so the app never crashes pre-rebuild. Server side is the `notify-push` Edge Function fired by DB webhooks (`stage7`, `PUSH_SETUP.md`); real delivery needs FCM/EAS creds + a rebuild.
- **`src/mesh/` + `modules/kaafilla-mesh/`** (Bluetooth-mesh chat) — a **local Expo module** (Kotlin under `modules/`). This is the prebuild-safe home for native code: `/android` and `/ios` are git-ignored/regenerated, so hand-edited files there get wiped — put native code in a local module instead. Clean-room BLE mesh **(no GPL — do not copy bitchat-android)**; wired into 1:1 `ChatRoom` (dual-send over Supabase + mesh, `client_id` dedup, per-chat `chat_mesh_keys` secret) with a dev panel at **You → "Bluetooth mesh (dev)"**. Design + phase status live in `MESH_PLAN.md`.

Rules when touching native code here:
- Changing Kotlin (or adding a native dep) needs a rebuild — `npx expo run:android`, or `cd android && ./gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a` then `adb -s <serial> install -r android/app/build/outputs/apk/debug/app-debug.apk`. **JS reload is not enough.** Sanity-check Kotlin fast with `cd android && ./gradlew.bat :kaafilla-mesh:compileDebugKotlin`.
- **Never top-level `import` a native module in app code** — it throws on a build that lacks it. Probe with `requireOptionalNativeModule(name)` (returns `null`) and fall back, exactly like `src/mesh/index.ts` and `src/notifications/push.ts`. Type-only imports from the module are fine (erased at runtime).
- BLE needs **two physical devices** to test (emulators have no Bluetooth). Android ≤11 scans via `ACCESS_FINE_LOCATION`; 12+ uses `BLUETOOTH_SCAN/ADVERTISE/CONNECT`. Background relay runs under a foreground service (`MeshForegroundService`).

Edge Functions (`economy`, `notify-push`) deploy via the **Supabase dashboard** (paste the file), not the CLI. `economy` keeps Verify JWT **on**; `notify-push` turns it **off** and authenticates with a `WEBHOOK_SECRET` header.

## Windows / Android dev reality

- **JDK 17 is mandatory** for the native build (`JAVA_HOME` → Microsoft.OpenJDK.17). The Android Studio bundled JBR is JDK 25 and fails `react-native-worklets`/`screens` `configureCMakeDebug` with a misleading *"restricted method in java.lang.System"* error.
- Physical-device dev streams JS from Metro over the USB reverse tunnel. If it red-screens with **"Unable to load script"**, the tunnel dropped — re-run `adb reverse tcp:8081 tcp:8081` and reload. Metro's file watcher on Windows sometimes misses edits; force a reload to pull a fresh bundle. Native-module changes (e.g. adding `expo-image`) require a rebuild, not just a reload.
- The x86_64 emulator on this setup renders **blank with the hardware GPU** (EGL 10-bit failure); launch with `-gpu swiftshader_indirect` (renders, but slower).
