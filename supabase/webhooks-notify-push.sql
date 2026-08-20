-- Database Webhooks → call the notify-push Edge Function on new connects/messages.
--
-- Prereqs:
--   1) Apply stage7-push-tokens.sql.
--   2) Deploy the notify-push function (Dashboard → Edge Functions), and turn
--      OFF "Verify JWT" for it (we authenticate with a shared secret instead).
--   3) Set a function secret WEBHOOK_SECRET (Dashboard → Edge Functions → notify-push
--      → Secrets), then put the SAME value in <WEBHOOK_SECRET> below.
--   4) Replace <PROJECT_REF> with your project ref (the subdomain of your API URL,
--      e.g. idvsngmwvpsfmupsgcpi).
--
-- The pg_net / supabase_functions plumbing is enabled by default on hosted
-- projects. Paste this into the Studio SQL editor.

-- New connect request → notify the recipient.
drop trigger if exists on_connect_created on public.connects;
create trigger on_connect_created
  after insert on public.connects
  for each row
  execute function supabase_functions.http_request(
    'https://<PROJECT_REF>.functions.supabase.co/notify-push',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}',
    '{}',
    '5000'
  );

-- New message → notify the other chat member(s).
drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row
  execute function supabase_functions.http_request(
    'https://<PROJECT_REF>.functions.supabase.co/notify-push',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}',
    '{}',
    '5000'
  );

-- Operator-portal notification (stage20) → notify the traveller it names.
-- These rows are written server-side by the portal when an operator calls a
-- seat, finalizes, cancels or reschedules a departure, or executes a refund.
-- The title/body are composed there and already lock-screen-safe, so the
-- function passes them through verbatim.
drop trigger if exists on_notification_created on public.notifications;
create trigger on_notification_created
  after insert on public.notifications
  for each row
  execute function supabase_functions.http_request(
    'https://<PROJECT_REF>.functions.supabase.co/notify-push',
    'POST',
    '{"Content-Type":"application/json","x-webhook-secret":"<WEBHOOK_SECRET>"}',
    '{}',
    '5000'
  );
