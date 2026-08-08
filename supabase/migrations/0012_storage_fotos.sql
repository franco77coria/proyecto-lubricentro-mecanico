-- ============================================================================
-- 0012 — Bucket de fotos de las órdenes
--
-- Privado, siempre. Las fotos de una recepción incluyen la cédula del auto y
-- daños del vehículo de un cliente: nada de eso puede quedar accesible por
-- URL para cualquiera que la adivine. Se sirven con URLs firmadas de vida
-- corta.
--
-- El aislamiento se apoya en el path: {taller_id}/{ot_id}/{archivo}. La
-- primera carpeta es el tenant, y las políticas comparan esa carpeta contra
-- el taller del usuario.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ot-fotos',
  'ot-fotos',
  false,
  -- 8 MB por archivo. La app comprime a ~200 KB antes de subir; este tope es
  -- la red de contención por si alguien sube el original desde otro lado.
  8388608,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Políticas
--
-- `storage.foldername(name)` devuelve las carpetas del path. El primer
-- elemento es el taller_id, y contra eso se compara.
-- ---------------------------------------------------------------------------

create policy "fotos ot: ver las del propio taller"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ot-fotos'
    and (storage.foldername(name))[1] = public.taller_actual()::text
  );

create policy "fotos ot: subir al propio taller"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ot-fotos'
    and (storage.foldername(name))[1] = public.taller_actual()::text
  );

-- Borrar se permite dentro del taller: una foto mal sacada tiene que poder
-- rehacerse sin llamar a soporte.
create policy "fotos ot: borrar las del propio taller"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ot-fotos'
    and (storage.foldername(name))[1] = public.taller_actual()::text
  );

-- Sin política de UPDATE: los archivos no se sobrescriben, se sube uno nuevo
-- y se borra el anterior. Así el histórico de una OT no cambia por accidente.
