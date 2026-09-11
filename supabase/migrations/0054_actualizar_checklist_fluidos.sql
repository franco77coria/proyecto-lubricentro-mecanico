-- ============================================================================
-- 0054 – Actualizar checklist estándar con fluidos, grados y frenos
-- ==========================================================================

create or replace function public.crear_checklist_default(p_taller uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plantilla uuid;
begin
  insert into public.checklist_plantilla (taller_id, nombre)
  values (p_taller, 'General')
  returning id into v_plantilla;

  insert into public.checklist_plantilla_item (taller_id, plantilla_id, etiqueta, categoria, orden)
  select p_taller, v_plantilla, i.etiqueta, i.categoria, i.orden
  from (values
    ('Aceite de motor',                           'Lubricación',            1),
    ('Filtro de aceite',                          'Filtros',                2),
    ('Filtro de aire',                            'Filtros',                3),
    ('Filtro habitáculo',                        'Filtros',                4),
    ('Filtro de nafta / combustible',             'Filtros',                5),
    ('Grados de refrigerante / Grados de frío',   'Refrigeración',          6),
    ('Líquido de frenos / Freno hidráulico',      'Fluidos y frenos',       7),
    ('Dirección hidráulica',                     'Fluidos',                8),
    ('Tren delantero y suspensión',               'Suspensión y dirección', 9),
    ('Tren trasero',                              'Suspensión y dirección', 10),
    ('Neumáticos y presión',                      'Ruedas',                11),
    ('Luces y batería',                           'Eléctrico',              12),
    ('Otros',                                    null,                    13)
  ) as i(etiqueta, categoria, orden);

  return v_plantilla;
end;
$$;
