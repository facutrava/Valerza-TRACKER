-- ============================================================================
-- Sales Tracker · Migración a multi-usuario (Supabase Auth con Google)
-- ============================================================================
-- Convierte la app de un solo usuario a multi-tenant: cada cuenta de Google
-- que inicia sesión ve y edita ÚNICAMENTE sus propios datos.
--
-- Ejecutar en el SQL Editor de Supabase EN ORDEN, siguiendo los pasos 1 a 6.
-- No pegues todo el archivo de una — hay un paso manual en el medio (Paso 3)
-- que requiere que primero inicies sesión una vez desde la app.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PASO 1 — Agregar la columna user_id (dueño de la fila) a cada tabla.
-- ----------------------------------------------------------------------------
alter table bloques                add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table objetivos              add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table aportes                add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table historico_migrado      add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table cotizaciones_mensuales add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- Las claves únicas de bloques y cotizaciones eran globales; ahora son por usuario.
alter table bloques drop constraint if exists bloques_slug_key;
alter table bloques add constraint bloques_user_slug_key unique (user_id, slug);

alter table cotizaciones_mensuales drop constraint if exists cotizaciones_mensuales_anio_mes_key;
alter table cotizaciones_mensuales add constraint cotizaciones_user_anio_mes_key unique (user_id, anio, mes);

-- RLS: cada usuario solo ve y edita las filas donde user_id = su propio uid.
drop policy if exists "allow all bloques" on bloques;
drop policy if exists "bloques por usuario" on bloques;
create policy "bloques por usuario" on bloques for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all objetivos" on objetivos;
drop policy if exists "objetivos por usuario" on objetivos;
create policy "objetivos por usuario" on objetivos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all aportes" on aportes;
drop policy if exists "aportes por usuario" on aportes;
create policy "aportes por usuario" on aportes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all historico" on historico_migrado;
drop policy if exists "historico por usuario" on historico_migrado;
create policy "historico por usuario" on historico_migrado for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "allow all cotizaciones" on cotizaciones_mensuales;
drop policy if exists "cotizaciones por usuario" on cotizaciones_mensuales;
create policy "cotizaciones por usuario" on cotizaciones_mensuales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- PASO 2 — Configurar Google como proveedor de login (fuera del SQL Editor).
-- ----------------------------------------------------------------------------
-- 1. En Google Cloud Console, creá un OAuth Client ID (tipo "Web application").
--    Como "Authorized redirect URI" agregá:
--      https://zuzwngvwmjizxlidjfxi.supabase.co/auth/v1/callback
-- 2. En el dashboard de Supabase: Authentication > Sign In / Providers > Google.
--    Activalo y pegá el Client ID y Client Secret que te dio Google.
-- 3. En Authentication > URL Configuration, agregá en "Redirect URLs":
--      http://localhost:5173
--      https://valerzatracker.netlify.app  (o la URL final del sitio)
-- Ver instructivo detallado que te pasó Claude aparte.


-- ----------------------------------------------------------------------------
-- PASO 3 — Iniciar sesión UNA VEZ con Google desde la app (localhost o el sitio
-- ya desplegado) ANTES de seguir. Recién ahí vas a existir en auth.users.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- PASO 4 — Asignarte los datos que ya existían (los tuyos, cargados antes de
-- tener login) a tu propia cuenta de Google.
-- ----------------------------------------------------------------------------
-- 4a) Buscá tu uuid:
--     select id, email from auth.users;
--
-- 4b) Reemplazá 'TU-UUID-ACA' por ese uuid y corré estos 5 updates:
--
-- update bloques                set user_id = 'TU-UUID-ACA' where user_id is null;
-- update objetivos              set user_id = 'TU-UUID-ACA' where user_id is null;
-- update aportes                set user_id = 'TU-UUID-ACA' where user_id is null;
-- update historico_migrado      set user_id = 'TU-UUID-ACA' where user_id is null;
-- update cotizaciones_mensuales set user_id = 'TU-UUID-ACA' where user_id is null;


-- ----------------------------------------------------------------------------
-- PASO 5 — Una vez que el Paso 4 esté hecho (para vos y cualquier otro dato
-- viejo sin dueño), hacer user_id obligatorio.
-- ----------------------------------------------------------------------------
-- alter table bloques                alter column user_id set not null;
-- alter table objetivos              alter column user_id set not null;
-- alter table aportes                alter column user_id set not null;
-- alter table historico_migrado      alter column user_id set not null;
-- alter table cotizaciones_mensuales alter column user_id set not null;


-- ----------------------------------------------------------------------------
-- PASO 6 — Alta automática para compañeros nuevos: la primera vez que alguien
-- inicia sesión con Google, se le crean sus 3 bloques (ON, Amerian, Martín
-- Bronce) vacíos, listos para que cargue sus propios objetivos y aportes.
--
-- Importante: crear esto DESPUÉS del Paso 4, así no te crea un juego de
-- bloques vacíos duplicados a vos cuando iniciaste sesión por primera vez.
-- ----------------------------------------------------------------------------
create or replace function public.crear_bloques_nuevo_usuario()
returns trigger as $$
begin
  insert into public.bloques (user_id, slug, nombre, periodicidad, moneda_objetivo, orden) values
    (new.id, 'on',            'ON',            'mensual',    'DUAL', 1),
    (new.id, 'amerian',       'Amerian',       'trimestral', 'USD',  2),
    (new.id, 'martin_bronce', 'Martín Bronce', 'anual',      'USD',  3)
  on conflict (user_id, slug) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_bloques_nuevo_usuario();
