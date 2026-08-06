# Kaafilla

Dark-mode-first React Native (Expo) app for India-focused travel discovery + verified
solo-traveller social networking. iOS + Android. Phone base 390×844.

> **Expo SDK 57 has changed a lot.** Read the exact versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before writing native/Expo code.

## The one rule

**The HTML prototype is the source of truth.** It lives at
`/Users/aryansmac/Aryan Products /Kaafilla/Humraah mobile app design/Kaafilla Prototype.dc.html`
(30 screens, every interactive state, all copy). **Reproduce visible copy verbatim** — the
wording encodes the product's trust/safety voice and is not to be paraphrased. When in doubt
about layout, copy, or a state, open the prototype and match it.

## Stack

| Layer | Choice |
|---|---|
| App | Expo SDK 57, React Native, TypeScript strict |
| Nav | @react-navigation (native-stack + bottom-tabs) |
| State | Zustand (session) + @tanstack/react-query (server cache) |
| Forms | react-hook-form + zod |
| Anim | react-native-reanimated 4 (+ react-native-worklets), gesture-handler |
| Lists | @shopify/flash-list |
| Sheets | @gorhom/bottom-sheet |
| Backend | Supabase — Postgres, Auth (phone OTP), Realtime, Storage, RLS, Edge Functions (Deno) |
| Native seams (simulated) | expo-camera, expo-local-authentication, expo-location, expo-image-picker, expo-haptics, expo-blur |

## Getting started (new developer)

```bash
# 1. Install JS deps
cd kaafilla && npm install

# 2. Bring up the local backend (Postgres/Auth/Realtime/Storage via Docker).
#    Docker engine: Docker Desktop OR colima (headless, no GUI/licence):
brew install colima supabase/tap/supabase   # if not already installed
colima start                                 # starts the Docker daemon
supabase start                               # pulls images (first run is slow), applies migrations + seed

# 3. Point the app at it — copy .env.example → .env and paste the ANON_KEY that
#    `supabase start` printed (URL stays http://127.0.0.1:54321 for the simulator).
cp .env.example .env

# 4. Run the app (first native build compiles pods — several minutes):
npx expo run:ios
```

If you skip steps 2–3 the app still runs fully — it falls back to the local seed
(`src/data/seed.ts`), the same data that seeds Postgres. Add the `.env` to go live.

**Reset the DB after editing `supabase/migrations` or `seed.sql`:** `supabase db reset`.
**Supabase Studio** (browse/edit data): http://127.0.0.1:54323.
**Gotcha:** if `supabase start` fails with `docker-credential-desktop not found`, remove the
stale `"credsStore": "desktop"` line from `~/.docker/config.json` (leftover from Docker Desktop).

## Run

```bash
npx expo start            # metro / dev
npx expo run:ios          # native dev build on simulator (rebuild after adding a native module)
npm run typecheck         # tsc --noEmit  (must stay clean before every commit)
npx expo export --platform ios --output-dir /tmp/kf-export   # bundle sanity (must stay clean)
supabase start / stop     # local backend;  colima start / stop  controls the Docker VM
```

## Design tokens — never hardcode

All colors/spacing/radii/type come from `src/theme/tokens.ts`, consumed via `useTheme()`.
No literal hex, px font sizes, or spacing in screens/components.

Key role mappings (from the prototype, not guesses):
- **Primary CTA**: bg `accentL3` (#d2cefd), text `accentD4` (#2b2741). Disabled/secondary:
  `rgba(245,244,255,.14)` bg / `#f5f4ff` text.
- **App bg** `bg` (#161826); cards/inputs/sheets `surface` (#232532); tab bar `surfaceRaised` (#1b1d2b).
- **Elevation = 1px rings, not soft shadows** (`shadows.*` encode this via borders). Selected = ring `accent` (#9184d9).
- **Tab bar**: height 74; active tint `accentL4` (#b5abfc), inactive `textMuted` (#75798c).
- **OTP box**: 56px tall, radius 12, ring `#3f424d` ↔ `#9184d9`.
- Splash/verify hero = radial gradient (`gradients.hero`); bottom sheet radius `22 22 44 44`.

## The gating matrix — the most important product rule

Always open to everyone: **trips, prices, filters, compare, reviews, explore**.

Verified-only — any attempt routes to the **VerifyGate** sheet (records `gateFrom` origin,
returns there after verifying): **ratios, people/profiles, chats, handles, waitlist join,
send connect, looking-board read/post, host a plan, ask to join**.

Enforced twice: Supabase **RLS** (server truth) + the **`useVerifiedAction()`** hook (UX).
A `returning` user (chosen on the phone screen) skips profile-build and lands verified on the feed.

## The ₹49 wallet economy (server-authoritative — Edge Functions, never the client)

- Priority order = **paid ₹49 > FIFO**; never displaces an already-paid seat; only `cap`
  priority places sold per batch.
- Seat called → **24h** to pay the trip cost or it passes; the ₹49 is **not** refunded.
- Batch fills without you → ₹49 credited to the **Kaafilla wallet**, usable as priority on
  the next trip ahead of cash.
- Hosting a plan → ₹49 charged **only when the first traveller joins**.
- Settlement money never touches Kaafilla — UPI between users; **both sides confirm** before a
  balance clears; the "all settled" mark appears when the last balance clears.

## Data model (Phase 2)

`profiles, photos, operators, trips, plans, itineraries, waitlist_entries, priority_purchases,
wallets, wallet_ledger, connects, chats, chat_members, messages, expenses, settlements,
looking_posts, explore_places, reviews, safety_settings`. Seed = the exact prototype catalog
(8 operator trips, 3 traveller plans, operators, PEOPLE, reviews, 7 EXPLORE regions, itineraries).
Verbatim copy + seed data live in `src/data/`.

## Component conventions

- Screens wrap in the `Screen` layout and read theme via `useTheme()`.
- Reuse the atoms in `src/components/atoms` — do not re-implement Button/Input/Chip/etc.
- Every interactive element: `accessibilityLabel` + `accessibilityRole` (+ `accessibilityHint`
  when non-obvious). Min touch target 48×48.
- Bottom CTAs use `useSafeAreaInsets()`. Responsive across 375–430px; sizes/spacing from tokens only.

## Integration seams — never call vendor SDKs from screens

`src/verification/` (Aadhaar KYC), `src/payments/` (UPI), `src/mesh/` (Bluetooth mesh) are
typed interfaces with **simulated** implementations that reproduce the prototype UX. Real
UIDAI/DigiLocker, UPI intent, and BLE modules drop in behind these interfaces later.

## Folder map

```
src/
  theme/        tokens.ts, ThemeProvider.tsx, animations.ts
  data/         copy.ts + seed catalog/people/plans/reviews/explore
  components/   atoms/  molecules/  layout/
  screens/      onboarding/ discover/ verify/ waitlist/ travellers/ chats/ explore/ profile/ hosting/
  navigation/   RootNavigator, OnboardingStack, MainTabs, tabStacks
  store/        authStore, tripStore, chatStore, walletStore
  hooks/        useVerifiedAction, useOTPTimer, useWaitlistQueue, ...
  api/          client (supabase) + trips/users/verification/payments
  verification/ payments/ mesh/   ← simulated integration seams
  types/  utils/
```

## Status — what's built (all typecheck- + bundle-clean, verified on simulator)

Every screen from the prototype **and** the explorations archive is implemented:

- **Onboarding**: Splash (animated) → ValueProp → PhoneEntry (new/returning branch) → OTPVerify
  (keypad + 60s timer) → PhotoUpload (native crop) → ProfileBuild → TravelPrefs (chip groups,
  habits, "Other" free-text with fuzzy match + exact error strings).
- **Discover**: DiscoverFeed (live filter/sort, active-filter chips, empty state, verified/unverified),
  FilterSheet, TripDetail (+ "Switched to…" banner), PlanDetail, PriceComparison (full sticky-column
  table + best-of + dot-plot + hide-same + Choose), Reviews, LocalDiscover/Explore, PlaceDetail.
- **Verification**: VerifyGate sheet → AadhaarOTP → SelfieCapture → Matching → VerifySuccess, gated
  app-wide via `useVerifiedAction` + `AppStack`.
- **Waitlist/wallet**: Joined, WaitlistView (priority open/active/sold-out, 4 terminal states,
  wallet-integrated ₹49 economy).
- **Travellers/chat**: TravellersBoard, TravelerProfile (handle lock/unlock), LookingForCompany,
  CreatePost, ChatList (Chats/Requests tabs, group locked→live→archived, Cancel sent),
  ChatRoom (Instagram link, mesh banner, archived read-only). Lock variants on all gated tabs.
- **You**: MyProfile, EditProfile, Wallet (+ledger), TripHistory, MyTrips, HostRequests, CreatePlan,
  SettleLedger (UPI), Safety, Activity.

**Backend**: full Supabase schema + RLS (gating matrix) + seed applied and live. Catalog reads
(trips/plans/operators/reviews) come from Postgres; social/profile tables are RLS-gated.

### What's intentionally simulated (swap-in points, not gaps)
- **Auth**: phone OTP is simulated (any 6 digits). Real login needs an SMS provider configured in
  `supabase/config.toml` (`[auth.sms]`, e.g. Twilio/MSG91). This is the key unlock — it enables
  live RLS-enforced profiles, realtime chat, and the write-side Edge Functions.
- **Aadhaar KYC / UPI / Bluetooth mesh**: simulated behind `src/{verification,payments,mesh}/`.
- **Chat/connects**: client-side (`chatStore`) until auth sessions exist; then move to Realtime.
- **Edge Functions** (waitlist queue ordering, seat lifecycle, wallet credit, connect-respond,
  settlement-confirm): the client simulates these outcomes today; implement server-side under
  `supabase/functions/` when auth is live.

### Suggested next steps for the new dev
1. Wire real phone-OTP auth (SMS provider) → real sessions.
2. Move connects/chat to Supabase Realtime; implement the write-side Edge Functions.
3. Replace the KYC/UPI/mesh simulated impls with real SDKs behind the existing seams.
4. Add real trip images (feed/detail currently use gradient placeholders).

Original phase plan (historical): `~/.claude/plans/jazzy-questing-whale.md`.
