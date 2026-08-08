-- ============================================================================
-- 0011 — Rate limit de autenticación
--
-- Sin esto, el login acepta intentos sin más freno que el propio de Supabase,
-- que es global y generoso: alcanza para probar contraseñas de a miles contra
-- una cuenta concreta.
--
-- Vive en Postgres y no en un servicio externo (Upstash y compañía) por dos
-- razones: no agrega una credencial más que administrar, y sobre todo no mete
-- una dependencia de red en el camino crítico del login — si ese servicio se
-- cae, nadie entra al sistema.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

create table public.intento_auth (
  id        bigserial primary key,
  -- Hash, nunca el email en claro: esta tabla es legible por el rol que
  -- ejecuta la función y no tiene por qué exponer quién intentó entrar.
  clave     text not null,
  creado_en timestamptz not null default now()
);

create index intento_auth_clave_idx on public.intento_auth (clave, creado_en desc);
create index intento_auth_purga_idx on public.intento_auth (creado_en);

alter table public.intento_auth enable row level security;
-- Sin políticas: nadie la toca directo. Solo entra por la función de abajo.

-- ---------------------------------------------------------------------------
-- Chequeo y registro en una sola llamada
--
-- Devuelve { permitido, restantes, espera_segundos }.
-- Cuenta ANTES de insertar, para que el intento que supera el tope ya salga
-- rechazado y no quede "uno de gracia".
-- ---------------------------------------------------------------------------

create or replace function public.chequear_rate_limit(
  p_clave   text,
  p_max     integer default 8,
  p_ventana interval default '15 minutes'
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_hash    text := encode(extensions.digest(p_clave, 'sha256'), 'hex');
  v_desde   timestamptz := now() - p_ventana;
  v_cuenta  integer;
  v_primero timestamptz;
begin
  -- Purga oportunista: mantiene la tabla chica sin necesitar un cron.
  -- Se hace de a poco y solo de vez en cuando para no pagarla en cada login.
  if random() < 0.02 then
    delete from public.intento_auth where creado_en < now() - interval '1 day';
  end if;

  select count(*), min(creado_en)
  into v_cuenta, v_primero
  from public.intento_auth
  where clave = v_hash and creado_en > v_desde;

  if v_cuenta >= p_max then
    return jsonb_build_object(
      'permitido', false,
      'restantes', 0,
      -- Cuánto falta para que el intento más viejo salga de la ventana.
      'espera_segundos', greatest(1, ceil(extract(epoch from (v_primero + p_ventana - now()))))
    );
  end if;

  insert into public.intento_auth (clave) values (v_hash);

  return jsonb_build_object(
    'permitido', true,
    'restantes', p_max - v_cuenta - 1,
    'espera_segundos', 0
  );
end;
$$;

-- El login ocurre sin sesión, así que `anon` tiene que poder ejecutarla.
revoke execute on function public.chequear_rate_limit(text, integer, interval) from public;
grant execute on function public.chequear_rate_limit(text, integer, interval) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Limpieza del contador al entrar bien
--
-- Si no, alguien que se equivocó 7 veces y entró a la octava sigue arrastrando
-- los 7 intentos y se queda afuera al rato sin motivo.
-- ---------------------------------------------------------------------------

create or replace function public.limpiar_rate_limit(p_clave text)
returns void
language sql
volatile
security definer
set search_path = public, extensions, pg_temp
as $$
  delete from public.intento_auth
  where clave = encode(extensions.digest(p_clave, 'sha256'), 'hex');
$$;

revoke execute on function public.limpiar_rate_limit(text) from public;
grant execute on function public.limpiar_rate_limit(text) to anon, authenticated;
