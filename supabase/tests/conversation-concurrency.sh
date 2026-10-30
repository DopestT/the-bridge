#!/usr/bin/env bash
# Disposable database only; never load production credentials into this script.
set -euo pipefail
if [[ "${PGDATABASE:-}" != netizens_test || ! "${PGHOST:-}" =~ ^(localhost|127\.0\.0\.1)$ ]]; then
  echo 'Requires disposable local netizens_test' >&2; exit 1
fi
actor_a=00000000-0000-4000-8000-000000009111
actor_b=00000000-0000-4000-8000-000000009112
log_dir=$(mktemp -d)
cleanup() {
  wait || true
  psql -X -v ON_ERROR_STOP=1 -q -c "DELETE FROM auth.users WHERE id IN ('$actor_a','$actor_b')" >/dev/null
  rm -rf "$log_dir"
}
trap cleanup EXIT
psql -X -v ON_ERROR_STOP=1 -q <<SQL
INSERT INTO auth.users(id) VALUES ('$actor_a'),('$actor_b');
UPDATE public.citizens SET handle=CASE id WHEN '$actor_a'::uuid THEN 'concurrent_a' ELSE 'concurrent_b' END,
  onboarding_completed_at=now() WHERE id IN ('$actor_a','$actor_b');
SQL
pids=()
for i in {1..10}; do
  actor=$actor_a; target=concurrent_b
  if (( i % 2 == 0 )); then actor=$actor_b; target=concurrent_a; fi
  psql -X -v ON_ERROR_STOP=1 -q -c "BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims='{\"sub\":\"$actor\",\"is_anonymous\":false}'; SELECT * FROM public.request_conversation('$target'); COMMIT;" >"$log_dir/request-$i.log" 2>&1 &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then cat "$log_dir"/*.log; exit 1; fi
done
psql -X -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$ BEGIN
  IF (SELECT count(*) FROM public.conversation_requests WHERE requester_id IN ('$actor_a','$actor_b'))<>1
    OR (SELECT count(*) FROM public.conversation_threads WHERE created_by IN ('$actor_a','$actor_b'))<>0
    OR (SELECT count(*) FROM public.notifications WHERE actor_id IN ('$actor_a','$actor_b'))<>1 THEN
    RAISE EXCEPTION 'Concurrent requests duplicated or bypassed consent';
  END IF;
END \$\$;
SQL
request_id=$(psql -X -At -v ON_ERROR_STOP=1 -c "SELECT id FROM public.conversation_requests WHERE requester_id IN ('$actor_a','$actor_b')")
recipient=$(psql -X -At -v ON_ERROR_STOP=1 -c "SELECT recipient_id FROM public.conversation_requests WHERE id='$request_id'")
pids=()
for i in {1..10}; do
  psql -X -v ON_ERROR_STOP=1 -q -c "BEGIN; SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims='{\"sub\":\"$recipient\",\"is_anonymous\":false}'; SELECT * FROM public.respond_conversation_request('$request_id','accept'); COMMIT;" >"$log_dir/accept-$i.log" 2>&1 &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then cat "$log_dir"/*.log; exit 1; fi
done
psql -X -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$ BEGIN
  IF (SELECT count(*) FROM public.conversation_threads WHERE created_by IN ('$actor_a','$actor_b'))<>1
    OR (SELECT count(*) FROM public.thread_members WHERE citizen_id IN ('$actor_a','$actor_b'))<>2
    OR (SELECT count(*) FROM public.notifications WHERE actor_id IN ('$actor_a','$actor_b'))<>2 THEN
    RAISE EXCEPTION 'Concurrent acceptance duplicated threads, members or notifications';
  END IF;
END \$\$;
SQL
echo 'PASS concurrent reciprocal invitations and acceptance replay'
