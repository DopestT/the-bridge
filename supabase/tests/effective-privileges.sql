-- Run after all migrations in a disposable database; never against production.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %',label; end if;
end;
$$;
create function pg_temp.expect_denied(statement text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then return;
  end;
  raise exception 'Expected permission denial: %',statement;
end;
$$;

select pg_temp.assert_true(not has_column_privilege('authenticated','public.'||t,c,'UPDATE'),t||'.'||c)
from (values ('citizens','xp'),('citizens','status'),('world_entities','creator_id'),
 ('messages','thread_id'),('messages','sender_id'),('entity_memberships','entity_id'),
 ('entity_memberships','citizen_id'),('thread_members','role'),('notifications','payload'),
 ('entity_discussion_items','moderation_state')) v(t,c);
select pg_temp.assert_true(not has_table_privilege('anon',c.oid,'SELECT'),c.relname||' anon read')
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r';
select pg_temp.assert_true(not has_table_privilege('authenticated',c.oid,'TRUNCATE'),c.relname||' truncate')
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r';
select pg_temp.assert_true(has_table_privilege('service_role','public.messages','INSERT'),'service access preserved');
select pg_temp.assert_true(not has_function_privilege('anon','public.cast_yes_no_vote(uuid,text,text)','EXECUTE'),'anon vote RPC denied');
select pg_temp.assert_true(has_function_privilege('authenticated','public.cast_yes_no_vote(uuid,text,text)','EXECUTE'),'authenticated vote RPC retained');
select pg_temp.assert_true(not has_function_privilege(r,'public.handle_new_citizen()','EXECUTE'),'trigger RPC denied')
from (values ('anon'),('authenticated')) roles(r);

insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
select pg_temp.assert_true((select count(*)=2 from public.citizens),'Citizen trigger preserved');
insert into public.world_entities(id,place_id,entity_type,creator_id,title) values
 ('10000000-0000-4000-8000-000000000001','crews','group','00000000-0000-4000-8000-000000000001','Test group');
insert into public.conversation_threads(id,kind,created_by) values
 ('20000000-0000-4000-8000-000000000001','direct','00000000-0000-4000-8000-000000000001');
insert into public.thread_members(thread_id,citizen_id) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
update public.citizens set display_name='Allowed edit' where id=auth.uid();
select pg_temp.assert_true((select display_name='Allowed edit' from public.citizens where id=auth.uid()),'profile edit');
select pg_temp.expect_denied('update public.citizens set xp=999 where id=auth.uid()');
select pg_temp.expect_denied('update public.citizens set status=''suspended'' where id=auth.uid()');
select pg_temp.expect_denied('update public.thread_members set role=''admin'' where citizen_id=auth.uid()');
insert into public.entity_memberships(entity_id,citizen_id) values ('10000000-0000-4000-8000-000000000001',auth.uid());
insert into public.entity_discussion_items(id,entity_id,author_id,body,client_mutation_id) values
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',auth.uid(),'Post','40000000-0000-4000-8000-000000000001');
insert into public.entity_discussion_items(entity_id,author_id,parent_id,body,client_mutation_id) values
 ('10000000-0000-4000-8000-000000000001',auth.uid(),'30000000-0000-4000-8000-000000000001','Reply','40000000-0000-4000-8000-000000000002');
insert into public.messages(thread_id,sender_id,body) values ('20000000-0000-4000-8000-000000000001',auth.uid(),'Private');
select pg_temp.expect_denied('update public.messages set thread_id=''20000000-0000-4000-8000-000000000001'' where sender_id=auth.uid()');
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.assert_true((select count(*)=0 from public.messages),'nonmember private read denied');
select pg_temp.expect_denied('insert into public.messages(thread_id,sender_id,body) values (''20000000-0000-4000-8000-000000000001'',auth.uid(),''Unauthorized'')');
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":true}';
select pg_temp.assert_true((select count(*)=0 from public.places),'anonymous Auth user excluded');
reset role;
rollback;
