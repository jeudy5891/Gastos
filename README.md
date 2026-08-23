# Gastos Familiares

PWA para el control de gastos, ingresos, cuentas y tarjetas de crédito familiares.

## Stack

- Vite + React + Tailwind CSS
- Supabase (Auth + Postgres + Storage)

## Configuración

1. Copiar `.env.example` a `.env` y completar con los datos de tu proyecto Supabase
   (Settings → Data API → Project URL / anon key).
2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Ejecutar en desarrollo:

   ```bash
   npm run dev
   ```

## Base de datos

Los scripts SQL están en `supabase/`, en orden:

1. `schema.sql`
2. `migration_002_cuentas.sql`
3. `migration_003_perfil.sql`
4. `migration_004_delete_categorias.sql`
5. `migration_005_editar_eliminar.sql`
6. `migration_006_pagos_credito.sql`

Se ejecutan una sola vez cada uno, en orden, desde el SQL Editor de Supabase.
