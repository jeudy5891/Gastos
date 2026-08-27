-- ============================================================
-- Migración 009: Pendientes
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

create table public.pendientes (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id),
  titulo text not null,
  amount numeric(12, 2) not null check (amount > 0),
  due_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pendientes enable row level security;

create policy "La familia ve todos los pendientes"
  on public.pendientes for select to authenticated using (true);
create policy "Cada quien registra sus pendientes"
  on public.pendientes for insert to authenticated with check (user_id = auth.uid());
create policy "Cada quien edita sus pendientes"
  on public.pendientes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Cada quien elimina sus pendientes"
  on public.pendientes for delete to authenticated using (user_id = auth.uid());

create trigger pendientes_set_updated_at
  before update on public.pendientes
  for each row execute function public.set_updated_at();
