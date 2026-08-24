-- ============================================================
-- Migración 008: quincenas (fechas de pago), tipos de ingreso
-- editables, y parentesco "hija"
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

-- 1. Tipos de ingreso, ahora administrables desde Mantenimientos --------
create table public.income_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.income_types enable row level security;

create policy "Lectura de tipos de ingreso para la familia"
  on public.income_types for select to authenticated using (true);
create policy "La familia agrega tipos de ingreso"
  on public.income_types for insert to authenticated with check (true);
create policy "La familia elimina tipos de ingreso"
  on public.income_types for delete to authenticated using (true);

insert into public.income_types (name) values
  ('Salario'), ('Liquidación'), ('Salario escolar'), ('Ventas o servicios');

-- Migrar income.type (texto fijo) a income_type_id (catálogo editable)
alter table public.incomes add column if not exists income_type_id bigint references public.income_types (id);

update public.incomes e
set income_type_id = t.id
from public.income_types t
where e.type = t.name and e.income_type_id is null;

alter table public.incomes drop constraint if exists incomes_type_check;
alter table public.incomes drop column if exists type;

-- 2. Fechas de pago (definen las quincenas) ------------------------------
create table public.pay_periods (
  id bigint generated always as identity primary key,
  mes text not null,
  quincena smallint not null check (quincena in (1, 2)),
  pay_date date not null unique,
  created_at timestamptz not null default now()
);

alter table public.pay_periods enable row level security;

create policy "Lectura de fechas de pago para la familia"
  on public.pay_periods for select to authenticated using (true);
create policy "La familia agrega fechas de pago"
  on public.pay_periods for insert to authenticated with check (true);
create policy "La familia elimina fechas de pago"
  on public.pay_periods for delete to authenticated using (true);

insert into public.pay_periods (mes, quincena, pay_date) values
  ('Agosto', 2, '2026-08-13'),
  ('Septiembre', 1, '2026-08-25'),
  ('Septiembre', 2, '2026-09-11'),
  ('Octubre', 1, '2026-09-25'),
  ('Octubre', 2, '2026-10-13'),
  ('Noviembre', 1, '2026-10-27'),
  ('Noviembre', 2, '2026-11-12'),
  ('Diciembre', 1, '2026-11-25'),
  ('Diciembre', 2, '2026-12-11'),
  ('Enero', 1, '2026-12-23')
on conflict (pay_date) do nothing;

-- 3. Agregar "hija" como parentesco --------------------------------------
alter table public.profiles drop constraint if exists profiles_rol_check;
alter table public.profiles add constraint profiles_rol_check
  check (rol in ('esposo', 'esposa', 'hijo', 'hija'));
