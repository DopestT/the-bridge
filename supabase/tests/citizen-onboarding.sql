-- Disposable database only. Identity is server-derived; fixtures roll back.
begin;
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %',label; end if;
end;
$$;
create function pg_temp.expect_code(statement text, expected text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate=expected then return; end if;
    raise;
  end;
  raise exception 'Expected SQLSTATE %: %',expected,statement;
end;
$$;
insert into auth.users(id) values
 ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002');
insert into auth.users(id,is_anonymous) values ('00000000-0000-4000-8000-000000000003',true);
select pg_temp.assert_true((select onboarding_completed_at is null from public.citizens where id='00000000-0000-4000-8000-000000000001'),'trigger profile needs explicit completion');
select pg_temp.assert_true(not has_function_privilege('anon','public.complete_citizen_profile(text,text,text,text)','EXECUTE'),'anon RPC denied');
select pg_temp.assert_true(has_function_privilege('authenticated','public.complete_citizen_profile(text,text,text,text)','EXECUTE'),'authenticated RPC allowed');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.citizens','onboarding_completed_at','UPDATE'),'completion marker service owned');
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
select pg_temp.assert_true((select id=auth.uid() and handle='first_citizen' and onboarding_completed_at is not null
 from public.complete_citizen_profile(' First_Citizen ','First Citizen','privacy','commons')),'own profile completes');
select pg_temp.assert_true((select onboarding_completed_at is not null from public.citizens where id=auth.uid()),'completion persisted');
select pg_temp.expect_code('update public.citizens set handle=''INVALID!'' where id=auth.uid()','23514');
select pg_temp.expect_code('update public.citizens set display_name=''   '' where id=auth.uid()','23514');
select pg_temp.expect_code('update public.citizens set avatar_mode=''nonexistent-place'' where id=auth.uid()','23503');
select pg_temp.expect_code('select public.complete_citizen_profile(''ab'',''Valid Name'',''privacy'',''commons'')','22023');
select pg_temp.expect_code('select public.complete_citizen_profile(''space handle'',''Valid Name'',''privacy'',''commons'')','22023');
select pg_temp.expect_code('select public.complete_citizen_profile(''valid_handle'','''',''privacy'',''commons'')','22023');
select pg_temp.expect_code('select public.complete_citizen_profile(''valid_handle'',''Valid Name'',''invalid'',''commons'')','22023');
select pg_temp.expect_code('select public.complete_citizen_profile(''valid_handle'',''Valid Name'',''privacy'',''creative'')','22023');
select pg_temp.expect_code('select public.complete_citizen_profile(NULL,''Valid Name'',''privacy'',''commons'')','22023');
reset role;
update public.citizens set xp=42,level=2,citizen_mark_seed='server-seed' where id='00000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
select * from public.complete_citizen_profile('first_citizen','Updated Citizen','fictional','crews');
select pg_temp.assert_true((select xp=42 and level=2 and citizen_mark_seed='server-seed' from public.citizens where id=auth.uid()),'profile update cannot reset reputation/seed');
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.expect_code('select public.complete_citizen_profile(''first_citizen'',''Other Citizen'',''privacy'',''commons'')','23505');
select pg_temp.assert_true((select onboarding_completed_at is null from public.citizens where id=auth.uid()),'conflict cannot mark second profile complete');
reset role;
-- Simulate a permanent migrated user whose Auth INSERT predated the trigger.
delete from public.citizens where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.assert_true((select id=auth.uid() from public.complete_citizen_profile('second_citizen','Second Citizen','stylized','yesno')),'missing profile repaired without direct INSERT');
-- Checking current Auth state prevents pretending an anonymous account is permanent.
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000003","is_anonymous":false}';
select pg_temp.expect_code('select public.complete_citizen_profile(''anon_citizen'',''Anonymous'',''privacy'',''commons'')','42501');
reset role;
update auth.users set is_anonymous=false where id='00000000-0000-4000-8000-000000000003';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000003","is_anonymous":false}';
select pg_temp.assert_true((select id=auth.uid() from public.complete_citizen_profile('converted_citizen','Converted Citizen','likeness','local')),'anonymous conversion can complete after real conversion');
reset role;
update public.citizens set status='limited' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.expect_code('select public.complete_citizen_profile(''revived_citizen'',''Revived'',''privacy'',''commons'')','42501');
reset role;
update public.citizens set status='suspended' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.expect_code('select public.complete_citizen_profile(''revived_citizen'',''Revived'',''privacy'',''commons'')','42501');
reset role;
update public.citizens set status='deleted' where id='00000000-0000-4000-8000-000000000002';
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
select pg_temp.expect_code('select public.complete_citizen_profile(''revived_citizen'',''Revived'',''privacy'',''commons'')','42501');
set local request.jwt.claims='{}';
select pg_temp.expect_code('select public.complete_citizen_profile(''no_user'',''No User'',''privacy'',''commons'')','42501');
reset role;
rollback;
