-- ============================================================
-- Migración 007: el pago de crédito sale de una cuenta y afecta su saldo
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

alter table public.credit_payments
  add column if not exists debit_account_id bigint references public.accounts (id);

-- Recalcular el saldo de cuentas restando también los pagos de crédito
-- hechos desde cada una.
create or replace view public.account_balances as
select
  a.id as account_id,
  coalesce(inc.total, 0) - coalesce(exp.total, 0)
    - coalesce(out_tr.total, 0) + coalesce(in_tr.total, 0)
    - coalesce(cp.total, 0) as balance
from public.accounts a
left join (select account_id, sum(amount) as total from public.incomes group by account_id) inc
  on inc.account_id = a.id
left join (select account_id, sum(amount) as total from public.expenses group by account_id) exp
  on exp.account_id = a.id
left join (select from_account_id as account_id, sum(amount) as total from public.transfers group by from_account_id) out_tr
  on out_tr.account_id = a.id
left join (select to_account_id as account_id, sum(amount) as total from public.transfers group by to_account_id) in_tr
  on in_tr.account_id = a.id
left join (
  select debit_account_id as account_id, sum(amount) as total
  from public.credit_payments
  where debit_account_id is not null
  group by debit_account_id
) cp
  on cp.account_id = a.id;
