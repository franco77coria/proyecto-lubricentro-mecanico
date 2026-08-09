-- ============================================================================
-- 0031 — Ficha técnica: qué lleva cada auto
--
-- Cuelga de `motorizacion` y no de `modelo`, que es exactamente el motivo por
-- el que 0018 existe: una Amarok 2.0 TDI lleva 6,3 L y una V6 lleva 8,5 L, con
-- filtro distinto. Atada al modelo, la ficha estaría mal en la mitad de los
-- casos — y una ficha que a veces miente es peor que no tener ficha, porque el
-- mecánico deja de chequear.
--
-- ALCANCE, dicho de frente: no existe una fuente libre y confiable con las
-- capacidades y los códigos de filtro del parque argentino. Licenciar TecDoc es
-- la alternativa paga. Así que esto arranca con un seed CHICO y de alta
-- confianza (los motores que un taller ve todos los días) y se completa con el
-- uso, igual que el catálogo: lo que el taller carga queda `pendiente` y el
-- dueño lo aprueba.
--
-- Por eso cada ficha guarda `verificada`: una capacidad cargada a mano por un
-- taller no vale lo mismo que una del manual, y la pantalla tiene que poder
-- decirlo en vez de presentar todo con la misma autoridad.
-- ============================================================================

create table public.ficha_tecnica (
  motorizacion_id uuid primary key references public.motorizacion (id) on delete cascade,

  -- Aceite de motor: litros con el filtro incluido, que es como se compra.
  aceite_litros      numeric(4,2) check (aceite_litros is null or aceite_litros between 0.2 and 60),
  aceite_viscosidad  text check (aceite_viscosidad is null or aceite_viscosidad ~ '^[0-9]{1,2}W[0-9]{2}$'),
  aceite_norma       text,   -- 'API SN', 'ACEA C3', 'VW 504 00'

  -- Los otros fluidos. Texto libre porque acá la precisión de la unidad varía
  -- según el fabricante y forzar un numérico obligaría a inventar datos.
  caja_tipo          text,   -- 'Manual 5v', 'Automática 6v Aisin'
  caja_aceite        text,   -- '75W90 GL-4, 2.1 L'
  diferencial        text,
  refrigerante       text,   -- 'Orgánico G12+, 5.5 L'
  liquido_frenos     text,   -- 'DOT 4'
  direccion_hidraulica text,

  -- Códigos de filtro. Se guarda el del fabricante que el taller reconoce; las
  -- equivalencias entre marcas van en la tabla de abajo.
  filtro_aceite      text,
  filtro_aire        text,
  filtro_combustible text,
  filtro_habitaculo  text,

  -- Intervalo recomendado por el fabricante, si se conoce. Alimenta el
  -- recordatorio de service en vez del default del taller.
  service_km         integer check (service_km is null or service_km between 1000 and 100000),
  service_meses      smallint check (service_meses is null or service_meses between 1 and 60),

  notas              text,

  /**
   * Si sale del manual del fabricante o de una fuente que se chequeó.
   * Lo que carga un taller entra en false y la pantalla lo muestra distinto:
   * presentar un dato aportado con la misma autoridad que uno verificado es
   * cómo se propaga un error de tipeo a todos los talleres.
   */
  verificada         boolean not null default false,
  estado             public.estado_catalogo not null default 'pendiente',
  taller_origen_id   uuid references public.taller (id) on delete set null,

  creado_en          timestamptz not null default now(),
  actualizado_en     timestamptz not null default now()
);

create index ficha_pendiente_origen_idx on public.ficha_tecnica (taller_origen_id)
  where estado = 'pendiente';

-- ---------------------------------------------------------------------------
-- Equivalencias de filtro entre fabricantes
--
-- "No tengo el Mann, ¿cuál es el Fram?" es una pregunta de todos los días.
-- Se modela como pares no dirigidos normalizados: se guarda una sola fila por
-- par y la consulta busca en las dos puntas. Guardar A→B y B→A duplica y
-- después una de las dos se actualiza y la otra no.
-- ---------------------------------------------------------------------------

create table public.filtro_equivalencia (
  id         uuid primary key default gen_random_uuid(),
  -- Siempre el menor primero (lo garantiza el check), así el par es único.
  codigo_a   text not null check (length(trim(codigo_a)) > 0),
  codigo_b   text not null check (length(trim(codigo_b)) > 0),
  marca_a    text,
  marca_b    text,
  tipo       text,   -- 'aceite', 'aire', 'combustible', 'habitaculo'
  estado     public.estado_catalogo not null default 'pendiente',
  taller_origen_id uuid references public.taller (id) on delete set null,
  creado_en  timestamptz not null default now(),

  constraint filtro_equivalencia_orden check (upper(codigo_a) < upper(codigo_b))
);

create unique index filtro_equivalencia_par_key
  on public.filtro_equivalencia (upper(codigo_a), upper(codigo_b));
create index filtro_equivalencia_a_idx on public.filtro_equivalencia (upper(codigo_a));
create index filtro_equivalencia_b_idx on public.filtro_equivalencia (upper(codigo_b));

-- ---------------------------------------------------------------------------
-- RLS: catálogo global, mismo contrato que marca/modelo/motorizacion
-- ---------------------------------------------------------------------------

alter table public.ficha_tecnica enable row level security;
alter table public.filtro_equivalencia enable row level security;

create policy ficha_tecnica_select on public.ficha_tecnica
  for select to authenticated using (true);

create policy ficha_tecnica_alta_pendiente on public.ficha_tecnica
  for insert to authenticated
  with check (estado = 'pendiente' and verificada = false);

-- El taller puede corregir su propia ficha mientras siga pendiente. Una ya
-- aprobada solo la toca `service_role`: si cualquiera pudiera editarla, un
-- error de tipeo se propagaría a todos los talleres sin revisión.
create policy ficha_tecnica_edita_propia on public.ficha_tecnica
  for update to authenticated
  using (estado = 'pendiente' and taller_origen_id = public.taller_actual())
  with check (estado = 'pendiente' and verificada = false
              and taller_origen_id = public.taller_actual());

create policy filtro_equivalencia_select on public.filtro_equivalencia
  for select to authenticated using (true);

create policy filtro_equivalencia_alta_pendiente on public.filtro_equivalencia
  for insert to authenticated
  with check (estado = 'pendiente');

revoke all on public.ficha_tecnica from anon;
revoke all on public.filtro_equivalencia from anon;

-- ---------------------------------------------------------------------------
-- Lo que lleva un vehículo, listo para mostrar
-- ---------------------------------------------------------------------------

create or replace function public.ficha_de_vehiculo(p_vehiculo uuid)
returns jsonb
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_res jsonb;
begin
  select jsonb_build_object(
    'motorizacion', mt.nombre,
    'modelo', trim(concat_ws(' ', ma.nombre, mo.nombre)),
    'tiene_ficha', f.motorizacion_id is not null,
    'verificada', coalesce(f.verificada, false),
    'estado', f.estado,
    'aceite_litros', f.aceite_litros,
    'aceite_viscosidad', f.aceite_viscosidad,
    'aceite_norma', f.aceite_norma,
    'caja_tipo', f.caja_tipo,
    'caja_aceite', f.caja_aceite,
    'diferencial', f.diferencial,
    'refrigerante', f.refrigerante,
    'liquido_frenos', f.liquido_frenos,
    'direccion_hidraulica', f.direccion_hidraulica,
    'filtro_aceite', f.filtro_aceite,
    'filtro_aire', f.filtro_aire,
    'filtro_combustible', f.filtro_combustible,
    'filtro_habitaculo', f.filtro_habitaculo,
    'service_km', f.service_km,
    'service_meses', f.service_meses,
    'notas', f.notas
  )
  into v_res
  from public.vehiculo v
  join public.motorizacion mt on mt.id = v.motorizacion_id
  join public.modelo mo on mo.id = mt.modelo_id
  join public.marca ma on ma.id = mo.marca_id
  left join public.ficha_tecnica f
         on f.motorizacion_id = mt.id and f.estado <> 'rechazado'
  where v.id = p_vehiculo
    and v.taller_id = public.taller_actual();

  return v_res;
end;
$$;

revoke execute on function public.ficha_de_vehiculo(uuid) from anon, public;
grant  execute on function public.ficha_de_vehiculo(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Equivalencias de un código, en las dos direcciones
-- ---------------------------------------------------------------------------

create or replace function public.equivalencias_filtro(p_codigo text)
returns table (codigo text, marca text, tipo text)
language sql
stable
set search_path = public, pg_temp
as $$
  select e.codigo_b, e.marca_b, e.tipo
  from public.filtro_equivalencia e
  where upper(e.codigo_a) = upper(trim(p_codigo)) and e.estado <> 'rechazado'
  union
  select e.codigo_a, e.marca_a, e.tipo
  from public.filtro_equivalencia e
  where upper(e.codigo_b) = upper(trim(p_codigo)) and e.estado <> 'rechazado';
$$;

revoke execute on function public.equivalencias_filtro(text) from anon, public;
grant  execute on function public.equivalencias_filtro(text) to authenticated;
