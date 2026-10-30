-- The migration must preserve historical identity, then permit explicit repair.
begin;
do $$ begin
  if current_database()<>'netizens_test' then raise exception 'Disposable netizens_test only'; end if;
  if not exists (select 1 from public.citizens where id='00000000-0000-4000-8000-000000000099'
    and handle='Legacy Citizen' and display_name=' ' and avatar_mode='custom') then
    raise exception 'Legacy identity was silently rewritten';
  end if;
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"00000000-0000-4000-8000-000000000099","is_anonymous":false}';
select * from public.complete_citizen_profile('legacy_citizen','Legacy Citizen','privacy','commons');
reset role;
do $$ begin
  if not exists (select 1 from public.citizens where id='00000000-0000-4000-8000-000000000099'
    and handle='legacy_citizen' and display_name='Legacy Citizen' and avatar_mode='commons'
    and xp=42 and level=2 and citizen_mark_seed='legacy-server-seed' and onboarding_completed_at is not null) then
    raise exception 'Explicit legacy completion failed or reset server fields';
  end if;
end $$;
delete from auth.users where id='00000000-0000-4000-8000-000000000099';
commit;
