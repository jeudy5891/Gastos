-- ============================================================
-- Migración 003: Perfil (foto, nombre, parentesco)
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists rol text check (rol in ('esposo', 'esposa', 'hijo'));

-- Cada quien puede editar su propio perfil (antes solo se podía leer)
create policy "Cada quien edita su propio perfil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Bucket para fotos de perfil
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Las fotos de perfil son públicas"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Cada quien sube su propia foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Cada quien actualiza su propia foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Cada quien borra su propia foto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
