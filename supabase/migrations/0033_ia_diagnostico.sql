-- ============================================================================
-- 0033 — Registro de lo que sugirió la IA
--
-- Guardar la sugerencia no es auditoría por las dudas: es lo único que después
-- permite responder "¿acertó?". Sin esta tabla, la IA es una opinión que se
-- evapora en cuanto el mecánico cierra la pantalla, y no hay forma de saber si
-- vale la pena pagarla.
--
-- `causa_real` lo completa el taller cuando resuelve el problema. Comparado con
-- las hipótesis sugeridas, es la métrica que dice si la función sirve — y con el
-- tiempo, el material para mejorar el prompt con casos del propio rubro.
-- ============================================================================

create table public.ot_sugerencia_ia (
  id         uuid primary key default gen_random_uuid(),
  taller_id  uuid not null references public.taller (id) on delete cascade,
  ot_id      uuid not null references public.orden_trabajo (id) on delete cascade,

  -- 'diagnostico' (IA-1) o 'traduccion' (IA-2).
  tipo       text not null check (tipo in ('diagnostico', 'traduccion')),

  -- Lo que se le mandó y lo que contestó, para poder revisar un caso raro sin
  -- tener que reproducirlo.
  entrada    text not null,
  salida     jsonb not null,

  /**
   * Qué era en realidad. Lo carga el taller al resolver.
   * Sin esto la sugerencia no se puede evaluar nunca.
   */
  causa_real text,
  /** Si alguna de las hipótesis sugeridas resultó ser la correcta. */
  acerto     boolean,

  modelo     text not null,
  -- Tokens, para poder ver el gasto real por taller sin adivinar.
  tokens_entrada integer,
  tokens_salida  integer,

  creado_por uuid references public.perfil (user_id) on delete set null,
  creado_en  timestamptz not null default now()
);

create index ot_sugerencia_ot_idx on public.ot_sugerencia_ia (ot_id, tipo);
create index ot_sugerencia_taller_idx on public.ot_sugerencia_ia (taller_id, creado_en desc);
-- Para medir la tasa de acierto sin recorrer toda la tabla.
create index ot_sugerencia_evaluadas_idx on public.ot_sugerencia_ia (taller_id)
  where acerto is not null;

alter table public.ot_sugerencia_ia enable row level security;

create policy ot_sugerencia_select on public.ot_sugerencia_ia
  for select to authenticated
  using (taller_id = public.taller_actual());

create policy ot_sugerencia_escribe on public.ot_sugerencia_ia
  for all to authenticated
  using (taller_id = public.taller_actual())
  with check (taller_id = public.taller_actual());

revoke all on public.ot_sugerencia_ia from anon;

-- ---------------------------------------------------------------------------
-- Antecedentes del propio taller
--
-- Lo que hace que el diagnóstico asistido valga algo: en vez de preguntarle a
-- un modelo qué le pasa a un Gol en abstracto, se le pasan los casos que ESTE
-- taller ya resolvió en ESTE modelo. Es conocimiento que no está en internet.
--
-- Devuelve pares anomalía → descargo de órdenes ya entregadas: el descargo de
-- una orden abierta todavía no es una conclusión.
-- ---------------------------------------------------------------------------

create or replace function public.antecedentes_modelo(
  p_vehiculo uuid,
  p_limite   integer default 8
)
returns table (anomalia text, descargo text, patente text, fecha timestamptz)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    (select string_agg(n.texto, ' / ' order by n.orden)
       from public.ot_nota n where n.ot_id = o.id and n.tipo = 'anomalia'),
    (select string_agg(n.texto, ' / ' order by n.orden)
       from public.ot_nota n where n.ot_id = o.id and n.tipo = 'descargo'),
    v.patente,
    o.fecha_entrega
  from public.orden_trabajo o
  join public.vehiculo v on v.id = o.vehiculo_id
  where o.taller_id = public.taller_actual()
    and o.estado in ('entregado', 'cerrado')
    -- Mismo modelo que el vehículo de la consulta. El modelo y no la
    -- motorización: para saber qué se rompe seguido, un Gol 1.6 8v y un 1.6 MSI
    -- comparten casi todo lo que falla.
    and v.modelo_id = (select modelo_id from public.vehiculo where id = p_vehiculo)
    and v.id <> p_vehiculo
    and exists (select 1 from public.ot_nota n
                 where n.ot_id = o.id and n.tipo = 'descargo')
  order by o.fecha_entrega desc nulls last
  limit greatest(1, least(p_limite, 20));
$$;

revoke execute on function public.antecedentes_modelo(uuid, integer) from anon, public;
grant  execute on function public.antecedentes_modelo(uuid, integer) to authenticated;
