-- ============================================================
-- Gastos Familiares - esquema inicial
-- Ejecutar completo en Supabase: Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Perfiles --------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Los miembros de la familia ven todos los perfiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Crea el perfil automáticamente cuando se registra un usuario
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (new.id, new.raw_user_meta_data ->> 'nombre', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Categorías de gasto -----------------------------------------
create table public.expense_categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

create policy "Lectura de categorías para la familia"
  on public.expense_categories for select
  to authenticated
  using (true);

insert into public.expense_categories (name) values
  ('Alimentación'), ('Supermercado'), ('Transporte'), ('Educación'),
  ('Salud'), ('Vivienda'), ('Servicios'), ('Entretenimiento'),
  ('Ropa'), ('Tecnología'), ('Deudas'), ('Otros');

-- 3. Fuentes de pago / tarjetas ------------------------------------
create table public.payment_sources (
  id bigint generated always as identity primary key,
  name text not null unique,
  owner_user_id uuid references public.profiles (id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.payment_sources enable row level security;

create policy "Lectura de fuentes de pago para la familia"
  on public.payment_sources for select
  to authenticated
  using (true);

-- Tarjetas compartidas (sin dueño). Las personales ("Mi tarjeta" de
-- cada quien) se agregan después de crear los dos usuarios.
insert into public.payment_sources (name, owner_user_id) values
  ('Walmart', null),
  ('Credix', null);

-- 4. Gastos ----------------------------------------------------------
create table public.expenses (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  category_id bigint not null references public.expense_categories (id),
  payment_source_id bigint not null references public.payment_sources (id),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  expense_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "La familia ve todos los gastos"
  on public.expenses for select
  to authenticated
  using (true);

create policy "Cada quien registra sus propios gastos"
  on public.expenses for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Cada quien edita sus propios gastos"
  on public.expenses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Cada quien elimina sus propios gastos"
  on public.expenses for delete
  to authenticated
  using (user_id = auth.uid());

-- Mantener updated_at al día en cada edición
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();
