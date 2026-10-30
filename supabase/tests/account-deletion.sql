-- Disposable fixtures only. No production identities.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000008001'),('00000000-0000-4000-8000-000000008002');
insert into auth.sessions(id,user_id) values ('00000000-0000-4000-8000-000000008101','00000000-0000-4000-8000-000000008001');
insert into public.world_entities(id,place_id,entity_type,creator_id,title) values
('00000000-0000-4000-8000-000000008201','crews','group','00000000-0000-4000-8000-000000008001','Owned disposable space'),
('00000000-0000-4000-8000-000000008202','crews','group','00000000-0000-4000-8000-000000008002','Unrelated disposable space');
insert into public.conversation_threads(id,created_by,kind) values ('00000000-0000-4000-8000-000000008301','00000000-0000-4000-8000-000000008001','direct');
insert into public.thread_members(thread_id,citizen_id) values
('00000000-0000-4000-8000-000000008301','00000000-0000-4000-8000-000000008001'),
('00000000-0000-4000-8000-000000008301','00000000-0000-4000-8000-000000008002');
insert into public.messages(id,thread_id,sender_id,body) values
('00000000-0000-4000-8000-000000008401','00000000-0000-4000-8000-000000008301','00000000-0000-4000-8000-000000008001','Delete this private body');
insert into public.reports(reporter_id,target_citizen_id,category) values ('00000000-0000-4000-8000-000000008002','00000000-0000-4000-8000-000000008001','test');
insert into public.reports(reporter_id,target_entity_id,category) values ('00000000-0000-4000-8000-000000008002','00000000-0000-4000-8000-000000008201','test');
insert into public.reports(reporter_id,target_message_id,category) values ('00000000-0000-4000-8000-000000008002','00000000-0000-4000-8000-000000008401','test');
insert into public.world_audit_events(actor_citizen_id,event_type,payload) values ('00000000-0000-4000-8000-000000008001','test','{"private":"remove"}');
insert into public.moderation_actions(target_citizen_id,action_type,reason) values ('00000000-0000-4000-8000-000000008001','test','remove private detail');
do $$ begin
 if has_function_privilege('anon','public.delete_own_account(text)','EXECUTE') then raise exception 'Anonymous deletion grant'; end if;
 if has_table_privilege('authenticated','auth.users','DELETE') then raise exception 'Direct Auth deletion grant'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000008001","session_id":"00000000-0000-4000-8000-000000008101"}',true);
do $$ begin
 begin perform public.delete_own_account('DELETE'); raise exception 'Missing password proof allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000008001','session_id','00000000-0000-4000-8000-000000008101','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint-600),jsonb_build_object('method','token_refresh','timestamp',extract(epoch from now())::bigint)))::text,true);
do $$ begin
 begin perform public.delete_own_account('DELETE'); raise exception 'Refresh bypassed stale password proof'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000008001','session_id','00000000-0000-4000-8000-000000008199','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
do $$ begin
 begin perform public.delete_own_account('DELETE'); raise exception 'Revoked session allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000008001","session_id":"00000000-0000-4000-8000-000000008101","amr":{"method":"password"}}',true);
do $$ begin
 begin perform public.delete_own_account('DELETE'); raise exception 'Malformed password proof allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000008001','session_id','00000000-0000-4000-8000-000000008101','amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',extract(epoch from now())::bigint)))::text,true);
do $$ begin
 begin perform public.delete_own_account('not-confirmed'); raise exception 'No confirmation allowed'; exception when invalid_parameter_value then null; end;
end $$;
reset role;
-- Suspension must not trap an account or require completed onboarding for deletion.
update public.citizens set status='suspended' where id='00000000-0000-4000-8000-000000008001';
set local role authenticated;
do $$ begin
 if public.delete_own_account('DELETE')<>true then raise exception 'Deletion not confirmed'; end if;
 begin perform public.delete_own_account('DELETE'); raise exception 'Stale JWT deleted again'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if exists(select 1 from auth.users where id='00000000-0000-4000-8000-000000008001')
 or exists(select 1 from public.citizens where id='00000000-0000-4000-8000-000000008001')
 or exists(select 1 from auth.sessions where user_id='00000000-0000-4000-8000-000000008001')
 or exists(select 1 from public.world_entities where id='00000000-0000-4000-8000-000000008201')
 or exists(select 1 from public.conversation_threads where id='00000000-0000-4000-8000-000000008301')
 or exists(select 1 from public.messages where id='00000000-0000-4000-8000-000000008401')
 or exists(select 1 from public.reports where reporter_id='00000000-0000-4000-8000-000000008002')
 or exists(select 1 from public.world_audit_events where event_type='test' and payload->>'private'='remove')
 or exists(select 1 from public.moderation_actions where reason='remove private detail') then raise exception 'Account data survived deletion'; end if;
 if not exists(select 1 from auth.users where id='00000000-0000-4000-8000-000000008002')
 or not exists(select 1 from public.world_entities where id='00000000-0000-4000-8000-000000008202') then raise exception 'Unrelated data deleted'; end if;
end $$;
rollback;
