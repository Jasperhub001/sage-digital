-- SÅGÊ Digital — Stage 10.3 corrections: atomic rate-limit RPC + throttle cleanup
-- Apply manually after 20260405120000_storage_inquiry_hardening.sql
-- Do not apply automatically from the frontend.
--
-- SECURITY:
-- - consume_inquiry_rate_limit / cleanup_inquiry_submission_throttle are
--   SECURITY INVOKER and executable only by service_role.
-- - Anon / authenticated cannot call these RPCs.
-- - search_path is empty (fully qualify public.*).
-- - Both IP and email buckets are locked and updated in one transaction so
--   email denial never partially consumes the IP quota.

create or replace function public.consume_inquiry_rate_limit(
  p_ip_key text,
  p_email_key text,
  p_ip_max integer default 5,
  p_email_max integer default 3,
  p_window_seconds integer default 3600
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window interval;
  v_first_key text;
  v_second_key text;
  v_ip_window timestamptz;
  v_ip_count integer;
  v_email_window timestamptz;
  v_email_count integer;
  v_ip_effective integer;
  v_email_effective integer;
begin
  if p_ip_key is null or length(trim(p_ip_key)) = 0
     or p_email_key is null or length(trim(p_email_key)) = 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_key'
    );
  end if;

  if p_ip_max is null or p_ip_max < 1
     or p_email_max is null or p_email_max < 1
     or p_window_seconds is null or p_window_seconds < 1 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_limit'
    );
  end if;

  if p_ip_key = p_email_key then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'invalid_key'
    );
  end if;

  v_window := make_interval(secs => p_window_seconds);

  -- Ensure both rows exist (hit_count 0 = unused bucket ready for first consume).
  insert into public.inquiry_submission_throttle as t
    (bucket_key, window_started_at, hit_count)
  values
    (p_ip_key, v_now, 0),
    (p_email_key, v_now, 0)
  on conflict (bucket_key) do nothing;

  -- Lock in lexicographic order to avoid deadlocks under concurrency.
  if p_ip_key < p_email_key then
    v_first_key := p_ip_key;
    v_second_key := p_email_key;
  else
    v_first_key := p_email_key;
    v_second_key := p_ip_key;
  end if;

  perform 1
  from public.inquiry_submission_throttle
  where bucket_key = v_first_key
  for update;

  perform 1
  from public.inquiry_submission_throttle
  where bucket_key = v_second_key
  for update;

  select window_started_at, hit_count
  into v_ip_window, v_ip_count
  from public.inquiry_submission_throttle
  where bucket_key = p_ip_key;

  select window_started_at, hit_count
  into v_email_window, v_email_count
  from public.inquiry_submission_throttle
  where bucket_key = p_email_key;

  if v_ip_window is null or v_email_window is null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'throttle_unavailable'
    );
  end if;

  if v_ip_window <= (v_now - v_window) then
    v_ip_effective := 0;
  else
    v_ip_effective := coalesce(v_ip_count, 0);
  end if;

  if v_email_window <= (v_now - v_window) then
    v_email_effective := 0;
  else
    v_email_effective := coalesce(v_email_count, 0);
  end if;

  -- Deny without mutating either bucket when either limit is exhausted.
  if v_ip_effective >= p_ip_max then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'ip_limited'
    );
  end if;

  if v_email_effective >= p_email_max then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'email_limited'
    );
  end if;

  -- Consume both atomically within this transaction.
  if v_ip_window <= (v_now - v_window) then
    update public.inquiry_submission_throttle
    set window_started_at = v_now,
        hit_count = 1
    where bucket_key = p_ip_key;
  else
    update public.inquiry_submission_throttle
    set hit_count = v_ip_effective + 1
    where bucket_key = p_ip_key;
  end if;

  if v_email_window <= (v_now - v_window) then
    update public.inquiry_submission_throttle
    set window_started_at = v_now,
        hit_count = 1
    where bucket_key = p_email_key;
  else
    update public.inquiry_submission_throttle
    set hit_count = v_email_effective + 1
    where bucket_key = p_email_key;
  end if;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'ok'
  );
end;
$$;

create or replace function public.cleanup_inquiry_submission_throttle(
  p_retention_seconds integer default 7200
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_deleted integer := 0;
begin
  if p_retention_seconds is null or p_retention_seconds < 3600 then
    -- Refuse overly aggressive cleanup that could touch active 1h windows.
    p_retention_seconds := 7200;
  end if;

  delete from public.inquiry_submission_throttle
  where window_started_at < (clock_timestamp() - make_interval(secs => p_retention_seconds));

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.consume_inquiry_rate_limit(text, text, integer, integer, integer)
  from public, anon, authenticated;
revoke all on function public.cleanup_inquiry_submission_throttle(integer)
  from public, anon, authenticated;

grant execute on function public.consume_inquiry_rate_limit(text, text, integer, integer, integer)
  to service_role;
grant execute on function public.cleanup_inquiry_submission_throttle(integer)
  to service_role;

comment on function public.consume_inquiry_rate_limit(text, text, integer, integer, integer) is
  'Atomic dual-bucket inquiry rate limit for Edge Function (service_role only).';

comment on function public.cleanup_inquiry_submission_throttle(integer) is
  'Deletes expired inquiry throttle rows. Schedule via pg_cron or manual job (service_role only).';

-- Optional: if pg_cron is available on the project, schedule hourly cleanup.
-- Not enabled automatically (extension / permissions vary by plan).
-- Example (run manually after enabling extensions):
--   select cron.schedule(
--     'cleanup-inquiry-throttle',
--     '15 * * * *',
--     $$select public.cleanup_inquiry_submission_throttle(7200)$$
--   );
