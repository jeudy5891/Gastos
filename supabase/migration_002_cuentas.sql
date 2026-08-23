-- ============================================================
-- Migración 002: Cuentas, Ingresos, Créditos y Transferencias
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- Reemplaza las "fuentes de pago" fijas por Cuentas reales.
-- ============================================================

-- Todavía no hay gastos reales cargados por la app, se recrean limpias.
drop table if exists public.expenses;
drop table if exists public.payment_sources;

-- La familia administra el catálogo de tipos de gasto (Mantenimientos)
create policy "La familia agrega categorías"
  on public.expense_categories for insert
  to authenticated
  with check (true);

create policy "La familia edita categorías"
  on public.expense_categories for update
  to authenticated
  using (true)
  with check (true);

-- 1. Cuentas -------------------------------------------------------
create table public.accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  name text not null,
  type text not null check (type in ('debito', 'credito')),
  cutoff_day smallint check (cutoff_day between 1 and 31),
  payment_day smallint check (payment_day between 1 and 31),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint credito_requiere_fechas check (
    (type = 'credito' and cutoff_day is not null and payment_day is not null)
    or (type = 'debito' and cutoff_day is null and payment_day is null)
  )
);

alter table public.accounts enable row level security;

create policy "La familia ve todas las cuentas"
  on public.accounts for select to authenticated using (true);
create policy "Cada quien crea sus propias cuentas"
  on public.accounts for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus propias cuentas"
  on public.accounts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Ingresos --------------------------------------------------------
create table public.incomes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  account_id bigint not null references public.accounts (id),
  type text not null check (type in ('Salario', 'Liquidación', 'Salario escolar', 'Ventas o servicios')),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.incomes enable row level security;

create policy "La familia ve todos los ingresos"
  on public.incomes for select to authenticated using (true);
create policy "Cada quien registra sus propios ingresos"
  on public.incomes for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus propios ingresos"
  on public.incomes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Cada quien elimina sus propios ingresos"
  on public.incomes for delete to authenticated using (user_id = auth.uid());

create trigger incomes_set_updated_at
  before update on public.incomes
  for each row execute function public.set_updated_at();

-- 3. Gastos (recreada con cuenta en vez de fuente de pago fija) ------
create table public.expenses (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  account_id bigint not null references public.accounts (id),
  category_id bigint not null references public.expense_categories (id),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "La familia ve todos los gastos"
  on public.expenses for select to authenticated using (true);
create policy "Cada quien registra sus propios gastos"
  on public.expenses for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus propios gastos"
  on public.expenses for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Cada quien elimina sus propios gastos"
  on public.expenses for delete to authenticated using (user_id = auth.uid());

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- 4. Transferencias ----------------------------------------------------
create table public.transfers (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  from_account_id bigint not null references public.accounts (id),
  to_account_id bigint not null references public.accounts (id),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cuentas_distintas check (from_account_id <> to_account_id)
);

alter table public.transfers enable row level security;

create policy "La familia ve todas las transferencias"
  on public.transfers for select to authenticated using (true);
create policy "Cada quien registra sus transferencias"
  on public.transfers for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus transferencias"
  on public.transfers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Cada quien elimina sus transferencias"
  on public.transfers for delete to authenticated using (user_id = auth.uid());

create trigger transfers_set_updated_at
  before update on public.transfers
  for each row execute function public.set_updated_at();

-- 5. Saldo de cada cuenta, calculado automáticamente --------------------
create view public.account_balances as
select
  a.id as account_id,
  coalesce(inc.total, 0) - coalesce(exp.total, 0)
    - coalesce(out_tr.total, 0) + coalesce(in_tr.total, 0) as balance
from public.accounts a
left join (select account_id, sum(amount) as total from public.incomes group by account_id) inc
  on inc.account_id = a.id
left join (select account_id, sum(amount) as total from public.expenses group by account_id) exp
  on exp.account_id = a.id
left join (select from_account_id as account_id, sum(amount) as total from public.transfers group by from_account_id) out_tr
  on out_tr.account_id = a.id
left join (select to_account_id as account_id, sum(amount) as total from public.transfers group by to_account_id) in_tr
  on in_tr.account_id = a.id;

grant select on public.account_balances to authenticated;
