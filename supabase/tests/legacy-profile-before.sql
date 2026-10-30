-- Disposable upgrade fixture only. Run after the original migrations and before
-- onboarding/safety. Values were allowed by the historical profile contract.
do $$ begin
  if current_database()<>'netizens_test' then raise exception 'Disposable netizens_test only'; end if;
end $$;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000099');
update public.citizens set handle='Legacy Citizen',display_name=' ',avatar_mode='custom',
  xp=42,level=2,citizen_mark_seed='legacy-server-seed'
where id='00000000-0000-4000-8000-000000000099';
