-- ============================================================
-- Migración 005: permitir borrar cuentas propias
-- (editar ya estaba permitido; solo faltaba delete en accounts)
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

create policy "Cada quien elimina sus propias cuentas"
  on public.accounts for delete
  to authenticated
  using (user_id = auth.uid());
