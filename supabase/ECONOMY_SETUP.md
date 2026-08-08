# Server-authoritative ₹49 economy (feature #8)

The waitlist queue ordering, ₹49 priority, seat lifecycle, and wallet become real
and tamper-proof. Until the steps below are done the app **falls back to the
client simulator** (WaitlistView still works; the wallet reads the in-memory
store), so nothing breaks pre-deploy.

## What's in the repo

- `supabase/stage9-economy.sql` — columns (`priority_at`, `paid_at`, `plans.host_charged`),
  the `'called'` status, tamper-proof RLS (a client can only join/leave — never
  grant itself priority or a seat), the `v_waitlist_ordered` view (paid > priority
  > FIFO), and a `pg_cron` job that forfeits called-but-unpaid seats after 24h.
- `supabase/functions/economy/index.ts` — one Edge Function, action-dispatched:
  `join`, `buy-priority` (cash/wallet, ₹49, cap 6/batch), `call-seat`, `pay-seat`
  (24h window), `finalize-batch` (₹49→wallet for priority buyers), `host-charge`.
  Payment is **recorded-only** (simulated) — ledger/state are real, no money moves.
- Client: `src/api/economy.ts` + `useWallet`/`useWaitlist` hooks. `WaitlistView`
  and `Wallet` use live data when present, simulator otherwise.

## Setup

### 1. Database
Paste `supabase/stage9-economy.sql` into the Studio SQL editor and run it.
- If `create extension pg_cron` errors, enable **pg_cron** first: Dashboard →
  Database → Extensions → enable `pg_cron`, then re-run the file.

### 2. Edge Function
Dashboard → Edge Functions → **Deploy a new function** → name `economy` → paste
`supabase/functions/economy/index.ts`. Keep **Verify JWT = ON** (callers send
their user token). `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
are injected automatically.

No app rebuild needed — this is all JS + backend.

## Verify
Open a trip → Join the waitlist (Waitlist screen auto-joins). You should see a
real `waitlist_entries` row and your live position. "Pay ₹49 for priority" flips
`has_priority` server-side (a client can't do this directly — RLS blocks it).
"If you're not" → your ₹49 lands in `wallets`/`wallet_ledger` and shows on the
Wallet screen. Deploy logs show each action's result.

## Not yet wired
- **host-charge**: the action exists, but the plan-join/accept flow (HostRequests)
  is still a client stub — wire `hostCharge(planId)` at the point a plan gets its
  first real accepted join once that flow is server-backed.
- **call-seat** is traveller-triggered here (demo). In production an operator/admin
  calls the top of the queue; the 24h forfeit is already automatic via pg_cron.
