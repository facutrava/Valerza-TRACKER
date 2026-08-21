-- ============================================================================
-- Sales Tracker · Agrega ID de operación, tipo de operación y canal a aportes
-- ============================================================================
-- Ejecutar una sola vez en el SQL Editor de Supabase. Es seguro correrlo aunque
-- ya existan aportes cargados: las columnas nuevas quedan en null / con default
-- y no afectan las filas existentes.
-- ============================================================================

alter table aportes add column if not exists id_operacion text;
alter table aportes add column if not exists tipo_operacion text not null default 'nueva';
alter table aportes add column if not exists canal text;

alter table aportes drop constraint if exists aportes_tipo_operacion_check;
alter table aportes add constraint aportes_tipo_operacion_check
  check (tipo_operacion in ('nueva', 'renovacion'));

alter table aportes drop constraint if exists aportes_canal_check;
alter table aportes add constraint aportes_canal_check
  check (canal in ('efectivo', 'transferencia', 'cheque', 'efectivo_transferencia', 'on_valerza', 'on_amerian'));
