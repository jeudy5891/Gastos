-- ============================================================
-- Migración 004: permitir borrar categorías de gasto
-- Ejecutar completo en Supabase: SQL Editor -> Run
-- ============================================================

create policy "La familia elimina categorías"
  on public.expense_categories for delete
  to authenticated
  using (true);
