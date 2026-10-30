-- Disposable database only. These fixtures must never run on production.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %',label; end if;
end;
$$;
create function pg_temp.expect_denied(statement text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denial: %',statement;
end;
$$;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003');
insert into public.world_entities(id,place_id,entity_type,creator_id,title) values
 ('10000000-0000-4000-8000-000000000001','crews','group','00000000-0000-4000-8000-000000000001','Safety fixture');
insert into public.conversation_threads(id,kind,created_by) values
 ('20000000-0000-4000-8000-000000000001','direct','00000000-0000-4000-8000-000000000001');
insert into public.thread_members(thread_id,citizen_id) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001'),
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.messages(id,thread_id,sender_id,body) values
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','Old message');
insert into public.citizen_blocks(blocker_id,blocked_id) values
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
select pg_temp.assert_true((select count(*)=0 from public.messages),'blocked sender stays hidden after reload');
select pg_temp.expect_denied('insert into public.messages(thread_id,sender_id,body) values (''20000000-0000-4000-8000-000000000001'',auth.uid(),''Cannot send across block'')');
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
update public.messages set body='Edited across block' where id='30000000-0000-4000-8000-000000000001';
reset role;
select pg_temp.assert_true((select body='Old message' from public.messages where id='30000000-0000-4000-8000-000000000001'),'blocked sender cannot edit retained evidence');
update public.citizens set status='suspended' where id='00000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
select pg_temp.assert_true(not private.current_user_is_permanent(),'stale JWT loses suspended Citizen access');
select pg_temp.assert_true((select status='suspended' from public.citizens where id=auth.uid()),'restricted Citizen can read own account status without World access');
select pg_temp.assert_true((select count(*)=0 from public.places),'suspended Citizen cannot read protected World');
select pg_temp.expect_denied('insert into public.entity_discussion_items(entity_id,author_id,body,client_mutation_id) values (''10000000-0000-4000-8000-000000000001'',auth.uid(),''Cannot post'',''40000000-0000-4000-8000-000000000001'')');
update public.citizens set display_name='Suspended edit' where id=auth.uid();
reset role;
select pg_temp.assert_true((select display_name<>'Suspended edit' from public.citizens where id='00000000-0000-4000-8000-000000000001'),'suspended profile updates denied');
update public.citizens set status='deleted' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.assert_true(not private.current_user_is_permanent(),'deleted Citizen cannot reuse JWT');
reset role;
-- Auth deletion must deny immediately even if a token still says permanent.
delete from auth.users where id='00000000-0000-4000-8000-000000000003';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000003","is_anonymous":false}';
select pg_temp.assert_true(not private.current_user_is_permanent(),'deleted Auth user cannot reuse JWT');
reset role;
rollback;
