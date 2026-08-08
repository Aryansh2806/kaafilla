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

## Plan-join flow (host-charge trigger) — apply `stage10-plan-joins.sql`
Travellers ask to join a plan; the host accepts/declines. Accepting runs the
`respond-join` economy action, which bumps the plan's `joined` count and levies
the ₹49 host charge on the **first** accepted join — all server-side (only the
host can respond; verified in the function, not just RLS). Apply
`stage10-plan-joins.sql` and re-deploy the `economy` function (it gained the
`respond-join` action). PlanDetail's "Ask to join" and HostRequests then use real
data; pre-deploy they fall back (optimistic "request sent" / the simulator list).

Verify: as traveller A, ask to join B's plan → a `plan_joins` row appears; as host
B, HostRequests lists it → Accept flips it to `accepted`, `plans.joined` +1, and on
the first accept `plans.host_charged` → true (the ₹49). A 1:1 chat opens.

## Still demo-only
- **call-seat** is traveller-triggered here (demo). In production an operator/admin
  calls the top of the queue; the 24h forfeit is already automatic via pg_cron.
