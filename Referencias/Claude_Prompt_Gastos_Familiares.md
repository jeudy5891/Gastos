# Aplicación PWA para Registro de Gastos Familiares

## Objetivo

Desarrollar una aplicación web móvil tipo **PWA (Progressive Web App)** para llevar el control de los gastos mensuales familiares.

### Stack de desarrollo
- Visual Studio Code
- Claude Code
- Supabase (Backend + Base de Datos + Authentication)

---

# 1. IMPORTANTE: Leer primero mi Skill de PWA

Antes de comenzar a diseñar, instalar dependencias o escribir código, debes leer completamente los archivos de la siguiente ruta:

```text
C:\Users\jpaniaga\.claude\skills\pwa-instalable
```

Debes:

1. Revisar todos los archivos disponibles dentro de esa carpeta.
2. Entender las recomendaciones y estructura establecidas en la skill.
3. Utilizar esas instrucciones como base para construir esta aplicación.
4. No reemplazar las buenas prácticas indicadas en la skill sin una razón técnica.
5. Si encuentras una configuración, componente o patrón recomendado por la skill para una PWA instalable, utilizarlo en este proyecto.

Primero explícame brevemente:

- Qué encontraste en la skill.
- Cómo lo aplicarás al proyecto.

---

# 2. Objetivo de la aplicación

Quiero una aplicación extremadamente sencilla para que mi esposa y yo podamos registrar nuestros gastos diarios.

La aplicación debe permitir registrar rápidamente un gasto desde el celular.

Debe permitir consultar:

1. Cuánto hemos gastado durante el mes.
2. En qué tipos de gastos.
3. Quién realizó el gasto.
4. De cuál fuente/tarjeta se realizó el gasto.
5. Cuánto ha gastado cada uno.
6. Cuánto hemos gastado utilizando tarjetas compartidas.
7. Historial de gastos.

**Prioridad:** registrar un gasto debe tomar pocos segundos.

---

# 3. Usuarios

Inicialmente existirán solamente dos usuarios:

- Usuario 1: yo.
- Usuario 2: mi esposa.

Cada gasto debe quedar asociado automáticamente al usuario autenticado.

Registrar automáticamente:

- `user_id`
- fecha
- hora

Utilizar fecha/hora del servidor o base de datos cuando sea posible.

---

# 4. Autenticación

Utilizar **Supabase Authentication**.

Requisitos:

- Iniciar sesión.
- Mantener la sesión iniciada.
- Cerrar sesión.

La aplicación debe identificar automáticamente al usuario.

Los datos deben estar protegidos mediante:

- Supabase Row Level Security (RLS)
- Policies adecuadas

Solamente usuarios autorizados de la familia pueden acceder a los datos.

---

# 5. Registro de gastos

La pantalla principal debe enfocarse en registrar gastos de forma rápida.

## Tipo de gasto

Dropdown/select.

Categorías iniciales:

- Alimentación
- Supermercado
- Transporte
- Educación
- Salud
- Vivienda
- Servicios
- Entretenimiento
- Ropa
- Tecnología
- Deudas
- Otros

Las categorías deben administrarse desde base de datos sin modificar código.

## Monto

Campo numérico.

- Principalmente en colones costarricenses (₡)
- Validar montos inválidos o negativos

## Nota

Campo opcional.

Ejemplo:

> Compra de comida para la semana

---

# 6. Fuente del gasto / tarjeta

NO utilizar dropdown.

Utilizar botones grandes para móviles.

Opciones iniciales:

- Mi tarjeta
- Tarjeta de mi esposa
- Walmart
- Credix

Selección única.

Ejemplo visual:

```text
[ Mi tarjeta ]
[ Tarjeta esposa ]
[ Walmart ]
[ Credix ]
```

La opción seleccionada debe quedar claramente marcada.

---

# 7. Registro automático

Al guardar un gasto registrar automáticamente:

- ID del gasto
- Usuario que lo registró
- Tipo de gasto
- Monto
- Nota
- Fuente/tarjeta
- Fecha
- Hora
- Created_at
- Updated_at

No solicitar fecha ni hora manualmente.

---

# 8. Base de datos Supabase

Evaluar y proponer una estructura limpia y escalable.

## profiles

- id
- nombre
- email
- created_at

## expense_categories

- id
- name
- active
- created_at

## payment_sources

- id
- name
- owner_type
- active
- created_at

## expenses

- id
- user_id
- category_id
- payment_source_id
- amount
- note
- expense_date
- created_at
- updated_at

Evaluar posibles mejoras.

Considerar estructura:

```text
families
 └─ family_members
     └─ expenses
```

Explicar si realmente vale la pena para esta aplicación.

---

# 9. Seguridad

Implementar:

- Supabase Auth
- Row Level Security
- Policies
- Foreign Keys
- Constraints
- Validaciones

No depender únicamente del frontend.

La base de datos debe impedir datos incorrectos.

Ningún usuario externo debe poder consultar los gastos.

---

# 10. Dashboard mensual

Seleccionar:

- Mes
- Año

Mostrar:

## Total del mes

Ejemplo:

```text
₡850,000
```

## Total por persona

```text
Yo: ₡400,000
Esposa: ₡450,000
```

## Total por fuente/tarjeta

```text
Mi tarjeta: ₡200,000
Tarjeta esposa: ₡250,000
Walmart: ₡300,000
Credix: ₡100,000
```

## Total por categoría

```text
Alimentación: ₡200,000
Supermercado: ₡250,000
Transporte: ₡100,000
```

Usar gráficos solo cuando aporten valor.

---

# 11. Historial

Cada registro debe mostrar:

```text
Supermercado
₡25,500
Walmart
Registrado por: Esposa
22/08/2026 18:35
"Compra semanal"
```

Permitir:

- Filtrar por mes
- Filtrar por categoría
- Filtrar por usuario
- Filtrar por tarjeta/fuente
- Buscar por nota
- Ordenar por fecha

También:

- Editar gasto
- Eliminar gasto con confirmación

---

# 12. Experiencia móvil

Prioridades:

- Mobile-first
- Botones grandes
- Campos fáciles de tocar
- Navegación sencilla
- Buena legibilidad
- Evitar interfaces complejas
- Formularios cortos
- Registro en pocos segundos

Interfaz moderna, limpia y profesional.

---

# 13. PWA

La aplicación debe ser instalable.

Incluir:

- manifest.webmanifest
- Service Worker
- Cache
- Offline shell
- Iconos
- Theme color
- Background color
- Nombre de aplicación
- Short name
- Display standalone
- Start URL
- Configuración de instalación correcta

Utilizar lo recomendado por la skill PWA.

---

# 14. Aviso de instalación

Mostrar aviso discreto:

> Instala Gastos Familiares en tu teléfono para acceder más rápido.

Botón:

> Instalar aplicación

Debe detectar:

- Si ya está instalada
- Si el navegador permite instalación
- Evento beforeinstallprompt
- Si el usuario rechazó el aviso

Debe poder cerrarse.

Implementar alternativa para iOS/Safari cuando corresponda.

---

# 15. Service Worker

Mantenerlo ligero.

Objetivos:

1. Permitir instalación PWA.
2. Cachear recursos esenciales.
3. Carga rápida.
4. Mostrar interfaz básica sin conexión.

No implementar sincronización offline compleja en el MVP.

---

# 16. Nombre de la aplicación

Proponer nombres.

Temporalmente usar:

**Gastos Familiares**

La arquitectura debe permitir cambiar el nombre fácilmente.

---

# 17. Arquitectura

Antes de programar proponer:

1. Framework recomendado.
2. Lenguaje.
3. Estructura del proyecto.
4. Librerías necesarias.
5. Arquitectura frontend.
6. Arquitectura Supabase.
7. Estructura de tablas.
8. Relaciones.
9. RLS.
10. Estrategia PWA.
11. Estrategia Service Worker.
12. Estrategia de autenticación.
13. Manejo de estado.
14. Manejo de errores.

Evitar dependencias innecesarias.

Preferir la solución más simple posible.

---

# 18. GitHub

Preparar el proyecto para:

1. Crear repositorio.
2. Subir proyecto.
3. Configurar variables de entorno.
4. Publicarlo.
5. Abrir enlace desde celular.
6. Instalar como PWA.

Nunca incluir:

- Supabase Service Role Key
- Contraseñas
- Secretos
- Tokens privados
- Variables sensibles

Utilizar:

- `.env`
- `.env.example`

---

# 19. Variables de entorno

Crear:

```env
.env
```

Y:

```env
.env.example
```

Explicar:

- Qué variables configurar
- Dónde encontrarlas en Supabase

---

# 20. Diseño

La aplicación debe sentirse como una app móvil real.

Utilizar:

- Diseño limpio
- Espaciado cómodo
- Cards
- Botones grandes
- Iconos
- Tipografía clara
- Buen contraste
- Estados de carga
- Estados vacíos
- Mensajes claros
- Confirmaciones de acciones

---

# 21. Flujo principal

```text
Abrir aplicación
↓
Usuario autenticado
↓
Dashboard mes actual
↓
Botón grande +
↓
Registrar gasto
↓
Seleccionar categoría
↓
Introducir monto
↓
Seleccionar tarjeta
↓
Agregar nota opcional
↓
Guardar
↓
Confirmación
↓
Regresar al dashboard
```

El flujo debe ser extremadamente rápido.

---

# 22. Mejoras

## MVP

Implementar únicamente lo indispensable.

## Versión 2

Posibles mejoras:

- Presupuestos mensuales
- Alertas
- Gastos recurrentes
- Exportación Excel/CSV
- Gráficos avanzados
- Comparación entre meses
- División de gastos
- Adjuntar comprobantes
- Notificaciones
- Offline completo
- Reportes mensuales

No sobrecargar el MVP.

---

# 23. Forma de trabajo

Trabajar por fases.

## Fase 1

Leer Skill PWA.

## Fase 2

Analizar requerimientos.

## Fase 3

Proponer arquitectura.

## Fase 4

Proponer modelo de datos Supabase.

## Fase 5

Proponer políticas RLS.

## Fase 6

Proponer estructura del proyecto.

## Fase 7

Después de aprobación, comenzar implementación.

En cada fase explicar:

- Qué se hace.
- Por qué se hace.

---

# 24. Regla importante

Priorizar siempre:

- Simplicidad > cantidad de funcionalidades
- Seguridad > comodidad
- Mobile-first > desktop-first
- Código mantenible > complejidad innecesaria
- MVP funcional > sobreingeniería

No agregar funcionalidades no solicitadas sin justificar su necesidad.

---

# Entregable esperado antes de programar

Después de leer la skill PWA, entregar:

1. Resumen de la skill.
2. Arquitectura propuesta.
3. Modelo de datos propuesto.
4. Flujo de usuario.
5. Stack tecnológico recomendado.
6. Plan de implementación por fases.

**No empezar a escribir código todavía.**
