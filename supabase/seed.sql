-- ============================================================================
-- Valerza · Seed inicial
-- Ejecutar DESPUÉS de schema.sql, una sola vez.
-- Carga: los 3 bloques fijos, los objetivos 2026 tal como los definió Valerza,
-- y el histórico Ene-Jul 2026 migrado desde la planilla de Excel (sin detalle
-- de cliente, tal como se acordó).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) BLOQUES
-- ----------------------------------------------------------------------------
insert into bloques (slug, nombre, periodicidad, moneda_objetivo, orden) values
  ('on',           'ON',             'mensual',    'DUAL', 1),
  ('amerian',      'Amerian',        'trimestral', 'USD',  2),
  ('martin_bronce','Martín Bronce',  'anual',      'USD',  3)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2) OBJETIVOS 2026
-- ----------------------------------------------------------------------------

-- ON — objetivo mensual en ARS (tal como figura en la planilla)
insert into objetivos (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'ARS', v.monto
from bloques, (values
  ('2026-01', 150000000),
  ('2026-02', 154350000),
  ('2026-03', 157745700),
  ('2026-04', 161216105),
  ('2026-05', 164440428),
  ('2026-06', 167729236),
  ('2026-07', 170916092),
  ('2026-08', 174163497),
  ('2026-09', 177298440),
  ('2026-10', 180489812),
  ('2026-11', 183558139),
  ('2026-12', 186678627)
) as v(periodo_key, monto)
where bloques.slug = 'on'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- ON — objetivo mensual en USD (fijo, 100.000 todos los meses)
insert into objetivos (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'USD', 100000
from bloques, (values
  ('2026-01'),('2026-02'),('2026-03'),('2026-04'),
  ('2026-05'),('2026-06'),('2026-07'),('2026-08'),
  ('2026-09'),('2026-10'),('2026-11'),('2026-12')
) as v(periodo_key)
where bloques.slug = 'on'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- AMERIAN — objetivo trimestral en USD, 75.000 por trimestre
insert into objetivos (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'USD', 75000
from bloques, (values ('2026-Q1'),('2026-Q2'),('2026-Q3'),('2026-Q4')) as v(periodo_key)
where bloques.slug = 'amerian'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- MARTÍN BRONCE — objetivo anual en USD, 150.000 para 2026
insert into objetivos (bloque_id, periodo_key, anio, moneda, monto)
select id, '2026', 2026, 'USD', 150000
from bloques
where bloques.slug = 'martin_bronce'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- ----------------------------------------------------------------------------
-- 3) HISTÓRICO MIGRADO (Enero-Julio 2026, totales agregados sin detalle de cliente)
-- ----------------------------------------------------------------------------

-- ON — facturación mensual en ARS
insert into historico_migrado (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'ARS', v.monto
from bloques, (values
  ('2026-01', 162050757),
  ('2026-02', 374890447.59),
  ('2026-03', 153135412.63),
  ('2026-04', 331473698.22),
  ('2026-05', 168409502.84),
  ('2026-06', 255855000),
  ('2026-07', 1150053131.2)
) as v(periodo_key, monto)
where bloques.slug = 'on'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- ON — facturación mensual en USD
insert into historico_migrado (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'USD', v.monto
from bloques, (values
  ('2026-01', 130313),
  ('2026-02', 120730.65),
  ('2026-03', 276692.02),
  ('2026-04', 117092.99),
  ('2026-05', 351772.33),
  ('2026-06', 104388.16),
  ('2026-07', 552245.2)
) as v(periodo_key, monto)
where bloques.slug = 'on'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- AMERIAN — facturación trimestral en USD (Q1 y Q2 completos; Q3 = solo Julio,
-- Agosto y Septiembre se cargan como aportes nuevos y se suman a este mismo total)
insert into historico_migrado (bloque_id, periodo_key, anio, moneda, monto)
select id, v.periodo_key, 2026, 'USD', v.monto
from bloques, (values
  ('2026-Q1', 247601),
  ('2026-Q2', 258584.71),
  ('2026-Q3', 710594.9)
) as v(periodo_key, monto)
where bloques.slug = 'amerian'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- MARTÍN BRONCE — facturación acumulada a Julio (USD), año completo se sigue
-- sumando con los aportes nuevos desde Agosto
insert into historico_migrado (bloque_id, periodo_key, anio, moneda, monto)
select id, '2026', 2026, 'USD', 263520
from bloques
where bloques.slug = 'martin_bronce'
on conflict (bloque_id, periodo_key, moneda) do nothing;

-- ----------------------------------------------------------------------------
-- 4) COTIZACIONES MENSUALES
-- Pendiente: cargar el MEP de cierre de Enero a Julio 2026 desde la pantalla
-- "Cotizaciones" de la app (Facundo las va a pasar). Hasta entonces, el
-- consolidado en USD de esos meses va a mostrarse como "cotización pendiente".
-- ----------------------------------------------------------------------------
