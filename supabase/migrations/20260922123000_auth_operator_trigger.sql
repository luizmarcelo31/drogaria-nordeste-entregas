create or replace function public.handle_new_operator()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.operadores (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Atendente')
  )
  on conflict (id) do update set ativo = true, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_operator on auth.users;
create trigger on_auth_user_created_operator
after insert on auth.users
for each row execute function public.handle_new_operator();

insert into public.operadores (id, nome)
select id, coalesce(raw_user_meta_data ->> 'name', split_part(email, '@', 1), 'Atendente')
from auth.users
on conflict (id) do nothing;
