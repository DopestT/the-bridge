-- Disposable database only; fixtures roll back. Community questions are not elections.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end $$;
insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.world_entities(id,place_id,entity_type,creator_id,title) values
  ('10000000-0000-4000-8000-000000000001','yesno','question','00000000-0000-4000-8000-000000000001','Community fixture');
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
select pg_temp.assert_true(yes_count=1 and no_count=0 and user_choice='yes','first vote precedes results')
  from public.cast_yes_no_vote('10000000-0000-4000-8000-000000000001','yes');
select pg_temp.assert_true(yes_count=1 and no_count=0,'same vote replay does not duplicate')
  from public.cast_yes_no_vote('10000000-0000-4000-8000-000000000001','yes');
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.assert_true((select count(*)=0 from public.yes_no_votes),'nonvoter cannot read another raw vote');
select pg_temp.assert_true(yes_count=1 and no_count=1 and user_choice='no','second Citizen votes before reveal')
  from public.cast_yes_no_vote('10000000-0000-4000-8000-000000000001','no');
select pg_temp.assert_true((select count(*)=1 from public.yes_no_votes),'raw rows remain self-only');
select pg_temp.assert_true(yes_count=2 and no_count=0,'changing answer updates rather than duplicates')
  from public.cast_yes_no_vote('10000000-0000-4000-8000-000000000001','yes');
reset role;
update public.citizens set status='suspended' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
do $$ begin
  begin perform * from public.cast_yes_no_vote('10000000-0000-4000-8000-000000000001','no');
  exception when raise_exception then
    if sqlerrm='AUTH_REQUIRED' then return; end if;
    raise;
  end;
  raise exception 'Restricted Citizen vote was accepted';
end $$;
reset role;
rollback;
