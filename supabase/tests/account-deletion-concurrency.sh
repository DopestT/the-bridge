#!/usr/bin/env bash
# Disposable local PostgreSQL only. Deliberately pause deletion while a peer commits.
set -euo pipefail
if [[ "${PGDATABASE:-}" != netizens_test || ! "${PGHOST:-}" =~ ^(localhost|127\.0\.0\.1)$ ]]; then
  echo 'Requires disposable local netizens_test' >&2; exit 1
fi
log_dir=$(mktemp -d)
lock_process=''
delete_process=''
cleanup() {
  if [[ -n "$lock_process" ]]; then kill "$lock_process" 2>/dev/null || true; wait "$lock_process" 2>/dev/null || true; fi
  if [[ -n "$delete_process" ]]; then wait "$delete_process" 2>/dev/null || true; fi
  psql -X -q -v ON_ERROR_STOP=1 <<'SQL' >/dev/null
DROP TRIGGER IF EXISTS deletion_test_barrier ON auth.users;
DROP FUNCTION IF EXISTS public.deletion_test_barrier();
DELETE FROM auth.users WHERE id IN ('00000000-0000-4000-8000-000000008501','00000000-0000-4000-8000-000000008502');
SQL
  rm -rf "$log_dir"
}
trap cleanup EXIT
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO auth.users(id) VALUES ('00000000-0000-4000-8000-000000008501'),('00000000-0000-4000-8000-000000008502');
INSERT INTO auth.sessions(id,user_id) VALUES ('00000000-0000-4000-8000-000000008601','00000000-0000-4000-8000-000000008501');
INSERT INTO public.world_entities(id,place_id,entity_type,creator_id,title) VALUES ('00000000-0000-4000-8000-000000008701','crews','group','00000000-0000-4000-8000-000000008501','Deletion fixture parent');
CREATE FUNCTION public.deletion_test_barrier() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.id='00000000-0000-4000-8000-000000008501' THEN PERFORM pg_advisory_xact_lock(986671); END IF; RETURN OLD;
END $$;
CREATE TRIGGER deletion_test_barrier BEFORE DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.deletion_test_barrier();
SQL
PGAPPNAME=netizens_deletion_lock psql -X -qAt -v ON_ERROR_STOP=1 -c 'SELECT pg_advisory_lock(986671); SELECT pg_sleep(30)' >"$log_dir/lock.log" 2>&1 &
lock_process=$!
wait_for() {
  local query="$1"
  for attempt in {1..100}; do
    if [[ "$(psql -X -qAt -v ON_ERROR_STOP=1 -c "$query")" == t ]]; then return; fi
    sleep 0.1
  done
  cat "$log_dir"/*.log; echo 'Deletion concurrency barrier not reached' >&2; exit 1
}
wait_for "SELECT EXISTS(SELECT 1 FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.application_name='netizens_deletion_lock' AND l.locktype='advisory' AND l.granted)"
PGAPPNAME=netizens_deletion_rpc psql -X -qAt -v ON_ERROR_STOP=1 <<'SQL' >"$log_dir/delete.log" 2>&1 &
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000008501','session_id','00000000-0000-4000-8000-000000008601','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
SELECT public.delete_own_account('DELETE');
COMMIT;
SQL
delete_process=$!
wait_for "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='netizens_deletion_rpc' AND wait_event='advisory')"
# Commit a new descendant and evidence AFTER deletion has started, before cascades.
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO public.world_entities(id,parent_entity_id,place_id,entity_type,creator_id,title) VALUES ('00000000-0000-4000-8000-000000008702','00000000-0000-4000-8000-000000008701','crews','group','00000000-0000-4000-8000-000000008502','Concurrent child');
INSERT INTO public.moderation_actions(target_entity_id,action_type,reason,evidence) VALUES ('00000000-0000-4000-8000-000000008702','test','concurrent deletion evidence','{"private":"erase"}');
INSERT INTO public.world_audit_events(entity_id,event_type,payload) VALUES ('00000000-0000-4000-8000-000000008702','concurrent deletion fixture','{"private":"erase"}');
SQL
psql -X -qAt -v ON_ERROR_STOP=1 -c "SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE application_name='netizens_deletion_lock'" >/dev/null
wait "$lock_process" 2>/dev/null || true
lock_process=''
if ! wait "$delete_process"; then cat "$log_dir/delete.log"; exit 1; fi
delete_process=''
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM auth.users WHERE id='00000000-0000-4000-8000-000000008501')
 OR EXISTS(SELECT 1 FROM public.world_entities WHERE id IN ('00000000-0000-4000-8000-000000008701','00000000-0000-4000-8000-000000008702'))
 OR EXISTS(SELECT 1 FROM public.moderation_actions WHERE reason='concurrent deletion evidence')
 OR EXISTS(SELECT 1 FROM public.world_audit_events WHERE event_type='concurrent deletion fixture') THEN RAISE EXCEPTION 'Concurrent data survived erasure'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id='00000000-0000-4000-8000-000000008502') THEN RAISE EXCEPTION 'Unrelated Citizen removed'; END IF;
END $$;
SQL
echo 'PASS account erasure removes concurrently committed descendants and evidence'
