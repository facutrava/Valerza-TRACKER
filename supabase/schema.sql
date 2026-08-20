-- ============================================================================
-- Sales Tracker · Seguimiento de resultados comerciales
-- Esquema de base de datos (Supabase / Postgres)
-- Ejecutar completo en el SQL Editor de Supabase, una sola vez.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- BLOQUES: las 3 líneas de negocio fijas. No se crean/borran desde la app.
-- ----------------------------------------------------------------------------
create table if not exists bloques (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('on', 'amerian', 'martin_bronce')),
  nombre text not null,
  periodicidad text not null check (periodicidad in ('mensual', 'trimestral', 'anual')),
  moneda_objetivo text not null check (moneda_objetivo in ('ARS', 'USD', 'DUAL')),
  orden int not null default 0
);

-- ----------------------------------------------------------------------------
-- OBJETIVOS: metas fijadas para cada bloque y período.
-- ON tiene dos filas por período (una ARS, una USD). AMERIAN y MARTIN BRONCE
-- tienen una sola fila (USD) por período.
-- ----------------------------------------------------------------------------
create table if not exists objetivos (
  id uuid primary key default gen_random_uuid(),
  bloque_id uuid not null references bloques(id) on delete cascade,
  periodo_key text not null, -- '2026-01' | '2026-Q1' | '2026'
  anio int not null,
  moneda text not null check (moneda in ('ARS', 'USD')),
  monto numeric(18,2) not null check (monto >= 0),
  unique (bloque_id, periodo_key, moneda)
);

-- ----------------------------------------------------------------------------
-- APORTES: carga a nivel cliente, desde Agosto 2026 en adelante.
-- ----------------------------------------------------------------------------
create table if not exists aportes (
  id uuid primary key default gen_random_uuid(),
  bloque_id uuid not null references bloques(id) on delete restrict,
  cliente_nombre text not null,
  fecha date not null,
  moneda text not null check (moneda in ('ARS', 'USD')),
  monto numeric(18,2) not null check (monto > 0),
  tipo_cliente text not null check (tipo_cliente in ('nuevo', 'existente')),
  -- Solo se completa cuando la moneda del aporte no coincide con la moneda
  -- del objetivo del bloque (ARS en AMERIAN / MARTIN BRONCE). Se carga en el momento.
  cotizacion_mep_operacion numeric(12,2),
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_aportes_bloque_fecha on aportes (bloque_id, fecha);
create index if not exists idx_aportes_fecha on aportes (fecha);

-- ----------------------------------------------------------------------------
-- HISTORICO_MIGRADO: totales agregados Ene-Jul 2026 desde la planilla vieja,
-- sin detalle de cliente. Es de solo lectura desde la app (se carga una vez).
-- ----------------------------------------------------------------------------
create table if not exists historico_migrado (
  id uuid primary key default gen_random_uuid(),
  bloque_id uuid not null references bloques(id) on delete cascade,
  periodo_key text not null,
  anio int not null,
  moneda text not null check (moneda in ('ARS', 'USD')),
  monto numeric(18,2) not null default 0,
  unique (bloque_id, periodo_key, moneda)
);

-- ----------------------------------------------------------------------------
-- COTIZACIONES_MENSUALES: MEP de cierre de mes, usada solo para las vistas
-- consolidadas en USD (no afecta el cumplimiento de objetivo por bloque).
-- ----------------------------------------------------------------------------
create table if not exists cotizaciones_mensuales (
  id uuid primary key default gen_random_uuid(),
  anio int not null,
  mes int not null check (mes between 1 and 12),
  valor_mep numeric(12,2) not null check (valor_mep > 0),
  unique (anio, mes)
);

-- ----------------------------------------------------------------------------
-- Trigger para mantener updated_at al día en aportes
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_aportes_updated_at on aportes;
create trigger trg_aportes_updated_at
  before update on aportes
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: app de un solo usuario sin login. Se deja abierta a nivel de fila,
-- protegida por la anon key del proyecto (no se expone públicamente el proyecto).
-- Si en el futuro sumás autenticación, reemplazar estas políticas.
-- ----------------------------------------------------------------------------
alter table bloques enable row level security;
alter table objetivos enable row level security;
alter table aportes enable row level security;
alter table historico_migrado enable row level security;
alter table cotizaciones_mensuales enable row level security;

drop policy if exists "allow all bloques" on bloques;
create policy "allow all bloques" on bloques for all using (true) with check (true);

drop policy if exists "allow all objetivos" on objetivos;
create policy "allow all objetivos" on objetivos for all using (true) with check (true);

drop policy if exists "allow all aportes" on aportes;
create policy "allow all aportes" on aportes for all using (true) with check (true);

drop policy if exists "allow all historico" on historico_migrado;
create policy "allow all historico" on historico_migrado for all using (true) with check (true);

drop policy if exists "allow all cotizaciones" on cotizaciones_mensuales;
create policy "allow all cotizaciones" on cotizaciones_mensuales for all using (true) with check (true);
