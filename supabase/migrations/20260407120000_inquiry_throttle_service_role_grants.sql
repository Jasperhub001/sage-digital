-- SÅGÊ Digital — Stage 10.3 final privilege correction
-- Apply manually after 20260406120000_inquiry_rate_limit_rpc.sql
-- Do not apply automatically from the frontend.
--
-- Context:
-- consume_inquiry_rate_limit / cleanup_inquiry_submission_throttle are
-- SECURITY INVOKER and execute as the calling role (service_role via the
-- Edge Function). EXECUTE alone is not enough — the invoker also needs
-- table DML privileges on public.inquiry_submission_throttle.
--
-- Preserves:
-- - FORCE ROW LEVEL SECURITY on the throttle table
-- - No grants to anon / authenticated
-- - RPC EXECUTE limited to service_role
-- - Atomic locking logic unchanged
--
-- No sequence grants: bucket_key is text primary key (no serial/identity).
-- No extra schema grants: service_role already has USAGE on public in Supabase.

-- Reaffirm client roles cannot touch the throttle table.
revoke all on table public.inquiry_submission_throttle from anon, authenticated;

-- Privileges required by the invoker RPCs:
-- SELECT  — lock + read window/count
-- INSERT  — ensure bucket rows exist
-- UPDATE  — increment / reset windows
-- DELETE  — cleanup_inquiry_submission_throttle
grant select, insert, update, delete
  on table public.inquiry_submission_throttle
  to service_role;
