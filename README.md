# Valerza · Seguimiento de Resultados

App personal para registrar tus aportes de clientes por bloque (ON, Amerian, Martín
Bronce), medir cumplimiento de objetivos y exportar reportes en PDF con la identidad
de Valerza.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (tokens de marca en `tailwind.config.js`)
- Supabase (Postgres) como base de datos
- Recharts para los gráficos del panel
- jsPDF + jspdf-autotable para el export a PDF
- Deploy en Netlify

## 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. Andá a **SQL Editor** y corré, en este orden:
   - `supabase/schema.sql` — crea todas las tablas.
   - `supabase/seed.sql` — carga los 3 bloques, los objetivos 2026 y el histórico
     Enero-Julio migrado desde tu planilla de Excel.
3. Andá a **Project Settings > API** y copiá:
   - `Project URL`
   - `anon public key`

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completá `.env` con los dos valores de Supabase del paso anterior.

## 3. Desarrollo local

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## 4. Cargar las cotizaciones MEP históricas

El histórico Enero-Julio 2026 se migró sin cotización cargada (vos la vas a pasar).
Entrá a **Cotizaciones MEP** en la app y cargá el MEP de cierre de cada uno de esos
meses — hasta entonces, esos meses van a figurar como "cotización pendiente" en el
capital consolidado en USD del panel.

## 5. Deploy en Netlify

1. Subí este proyecto a un repo de GitHub.
2. En Netlify: **Add new site > Import an existing project**, elegí el repo.
3. Build command: `npm run build` · Publish directory: `dist` (ya están en `netlify.toml`).
4. En **Site settings > Environment variables**, agregá `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env`.
5. Deploy.

## Estructura del proyecto

```
src/
  types.ts                 tipos centrales (reflejan las tablas de Supabase)
  lib/supabase.ts          cliente de Supabase
  utils/calculations.ts    toda la lógica de cumplimiento, conversión a USD y rangos
  utils/format.ts          formateo de moneda, porcentajes y períodos
  utils/pdf.ts             generación del PDF de reportes
  context/DataContext.tsx  fetch + CRUD contra Supabase
  context/ThemeContext.tsx modo claro/oscuro
  components/              UI reutilizable (Sidebar, StatCard, formularios, etc.)
  pages/
    Dashboard.tsx           panel principal
    Aportes.tsx             alta/edición/borrado de aportes por cliente
    Objetivos.tsx           carga de objetivos por bloque y período
    Cotizaciones.tsx        cotización MEP de cierre de mes
    Reportes.tsx            export a PDF por rango
supabase/
  schema.sql                esquema de base de datos
  seed.sql                  datos iniciales (bloques, objetivos, histórico)
```

## Reglas de negocio clave (para tener en cuenta si lo modificás)

- **ON** tiene objetivo propio en ARS y en USD, medidos de forma independiente. Un
  aporte en ARS cuenta directo contra el objetivo ARS; uno en USD, contra el objetivo
  USD. No hay conversión entre sí para el cumplimiento de este bloque.
- **Amerian** (trimestral) y **Martín Bronce** (anual) tienen objetivo único en USD.
  Un aporte en ARS necesita la cotización MEP de esa operación puntual (se carga al
  momento de cargar el aporte) para convertirse y contar contra el objetivo.
- El **consolidado en USD** del panel (capital total acumulado, comparación entre
  bloques) usa siempre la cotización de **cierre de mes** (tabla
  `cotizaciones_mensuales`), no la cotización de la operación puntual.
- El objetivo se mide solo por capital que **entra**; los retiros no se registran ni
  descuentan.
- "Cliente nuevo" = nuevo para Valerza (no para tu cartera personal).
- El histórico Enero-Julio 2026 no tiene detalle de cliente — vive en
  `historico_migrado` y se suma a los totales por período, pero no aparece en el
  listado de **Aportes**. Si en algún momento conseguís el desglose por cliente de
  esos meses, se puede migrar a la tabla `aportes` y borrar las filas
  correspondientes de `historico_migrado`.
