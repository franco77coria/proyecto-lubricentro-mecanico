-- 1. Eliminar índice único estricto de motorizaciones para permitir motores con mismo nombre (ej. distinto año)
drop index if exists public.motorizacion_modelo_nombre_key;

-- 2. Trigger para verificar jerarquía de vehículo (Marca -> Modelo -> Motorizacion)
create or replace function public.verificar_jerarquia_vehiculo()
returns trigger
language plpgsql
security definer
as $$
declare
  v_modelo_marca_id uuid;
  v_motor_modelo_id uuid;
begin
  -- Si hay modelo, verificar que pertenezca a la marca
  if new.modelo_id is not null and new.marca_id is not null then
    select marca_id into v_modelo_marca_id from public.modelo where id = new.modelo_id;
    if v_modelo_marca_id != new.marca_id then
      raise exception 'El modelo seleccionado no pertenece a la marca indicada.';
    end if;
  end if;

  -- Si hay motorización, verificar que pertenezca al modelo
  if new.motorizacion_id is not null and new.modelo_id is not null then
    select modelo_id into v_motor_modelo_id from public.motorizacion where id = new.motorizacion_id;
    if v_motor_modelo_id != new.modelo_id then
      raise exception 'El motor seleccionado no pertenece al modelo indicado.';
    end if;
  end if;

  return new;
end;
$$;

create trigger trigger_verificar_jerarquia_vehiculo
  before insert or update on public.vehiculo
  for each row
  execute function public.verificar_jerarquia_vehiculo();

-- 3. Política RLS UPDATE para filtro_equivalencia (permite corregir aportes propios pendientes)
create policy filtro_equivalencia_edita_propia on public.filtro_equivalencia
  for update to authenticated
  using (estado = 'pendiente' and taller_origen_id = public.taller_actual())
  with check (estado = 'pendiente' and taller_origen_id = public.taller_actual());

-- 4. Trigger actualizado_en para tabla turno
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
security definer
as $$
begin
  new.actualizado_en = timezone('utc', now());
  return new;
end;
$$;

create trigger trigger_set_actualizado_en_turno
  before update on public.turno
  for each row
  execute function public.set_actualizado_en();
