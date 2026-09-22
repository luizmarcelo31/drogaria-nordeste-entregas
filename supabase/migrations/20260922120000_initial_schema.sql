create extension if not exists pgcrypto;

create type public.entregador_status as enum ('ativo', 'bloqueado', 'inativo');
create type public.acesso_tipo as enum ('entrada', 'saida');
create type public.acesso_status as enum ('registrado', 'bloqueado');
create type public.ocorrencia_nivel as enum ('advertencia', 'grave', 'bloqueio');
create type public.registro_status as enum ('aberta', 'resolvida');

create table public.operadores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  cargo text not null default 'Operadora',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entregadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  placa text not null unique check (placa ~ '^[A-Z0-9]{7}$'),
  telefone text not null,
  modelo text,
  cor text,
  status public.entregador_status not null default 'ativo',
  documento_validade date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.acessos (
  id uuid primary key default gen_random_uuid(),
  entregador_id uuid not null references public.entregadores (id),
  tipo public.acesso_tipo not null,
  status public.acesso_status not null default 'registrado',
  motivo text,
  registrado_por uuid references public.operadores (id) on delete set null,
  created_at timestamptz not null default now(),
  check (status = 'registrado' or motivo is not null)
);

create table public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  entregador_id uuid references public.entregadores (id) on delete set null,
  placa text check (placa is null or placa ~ '^[A-Z0-9]{7}$'),
  tipo text not null,
  descricao text not null,
  nivel public.ocorrencia_nivel not null default 'advertencia',
  status public.registro_status not null default 'aberta',
  resolvida_at timestamptz,
  resolvida_por uuid references public.operadores (id) on delete set null,
  registrada_por uuid references public.operadores (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((status = 'resolvida') = (resolvida_at is not null))
);

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid references public.ocorrencias (id) on delete cascade,
  acesso_id uuid references public.acessos (id) on delete cascade,
  titulo text not null,
  descricao text not null,
  severidade public.ocorrencia_nivel not null default 'advertencia',
  status public.registro_status not null default 'aberta',
  resolvido_at timestamptz,
  resolvido_por uuid references public.operadores (id) on delete set null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(ocorrencia_id, acesso_id) = 1),
  check ((status = 'resolvida') = (resolvido_at is not null))
);

create index acessos_entregador_created_at_idx on public.acessos (entregador_id, created_at desc);
create index acessos_created_at_idx on public.acessos (created_at desc);
create index ocorrencias_entregador_created_at_idx on public.ocorrencias (entregador_id, created_at desc);
create index ocorrencias_status_created_at_idx on public.ocorrencias (status, created_at desc);
create index alertas_status_created_at_idx on public.alertas (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger operadores_set_updated_at
before update on public.operadores
for each row execute function public.set_updated_at();

create trigger entregadores_set_updated_at
before update on public.entregadores
for each row execute function public.set_updated_at();

alter table public.operadores enable row level security;
alter table public.entregadores enable row level security;
alter table public.acessos enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.alertas enable row level security;

create policy "operadores autenticados podem consultar operadores"
on public.operadores for select to authenticated
using (ativo = true);

create policy "operadores autenticados podem gerenciar entregadores"
on public.entregadores for all to authenticated
using (exists (select 1 from public.operadores where id = auth.uid() and ativo = true))
with check (exists (select 1 from public.operadores where id = auth.uid() and ativo = true));

create policy "operadores autenticados podem gerenciar acessos"
on public.acessos for all to authenticated
using (exists (select 1 from public.operadores where id = auth.uid() and ativo = true))
with check (exists (select 1 from public.operadores where id = auth.uid() and ativo = true));

create policy "operadores autenticados podem gerenciar ocorrencias"
on public.ocorrencias for all to authenticated
using (exists (select 1 from public.operadores where id = auth.uid() and ativo = true))
with check (exists (select 1 from public.operadores where id = auth.uid() and ativo = true));

create policy "operadores autenticados podem gerenciar alertas"
on public.alertas for all to authenticated
using (exists (select 1 from public.operadores where id = auth.uid() and ativo = true))
with check (exists (select 1 from public.operadores where id = auth.uid() and ativo = true));