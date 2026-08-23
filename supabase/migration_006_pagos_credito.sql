-- ============================================================
-- Migración 006: Pagos de crédito y monto adeudado
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

-- Saldo adeudado inicial (para dar de alta una tarjeta que ya tiene saldo)
alter table public.accounts
  add column if not exists initial_debt numeric(12, 2) not null default 0;

-- Pagos que abonan a una tarjeta de crédito
create table public.credit_payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  account_id bigint not null references public.accounts (id),
  payment_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.credit_payments enable row level security;

create policy "La familia ve todos los pagos de crédito"
  on public.credit_payments for select to authenticated using (true);
create policy "Cada quien registra sus pagos de crédito"
  on public.credit_payments for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus pagos de crédito"
  on public.credit_payments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Cada quien elimina sus pagos de crédito"
  on public.credit_payments for delete to authenticated using (user_id = auth.uid());

create trigger credit_payments_set_updated_at
  before update on public.credit_payments
  for each row execute function public.set_updated_at();

-- Monto adeudado por tarjeta: inicial + gastos cargados - pagos realizados
create view public.credit_account_debt as
select
  a.id as account_id,
  a.initial_debt + coalesce(exp.total, 0) - coalesce(pay.total, 0) as debt
from public.accounts a
left join (select account_id, sum(amount) as total from public.expenses group by account_id) exp
  on exp.account_id = a.id
left join (select account_id, sum(amount) as total from public.credit_payments group by account_id) pay
  on pay.account_id = a.id
where a.type = 'credito';

grant select on public.credit_account_debt to authenticated;
