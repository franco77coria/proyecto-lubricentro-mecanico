-- ============================================================================
-- 0024 — Código de barras del producto
--
-- Va en su propia columna y NO reusa `sku`, aunque tentaba: son dos cosas
-- distintas. El SKU es el código del taller (el que escribe en la etiqueta del
-- estante); el código de barras es el del fabricante, viene impreso en el bidón
-- y no se elige. Un taller que ya usa códigos internos no podría escanear si le
-- pisamos el campo.
--
-- OJO con los privilegios: 0010 hizo
--   revoke update on public.producto from authenticated
-- y devolvió el UPDATE columna por columna. Una columna nueva NO entra sola en
-- ese grant, y el síntoma sería el peor: la escritura devuelve 204 y parece
-- funcionar (lección #36). Por eso se agrega explícitamente abajo.
-- ============================================================================

alter table public.producto
  add column codigo_barras text
    check (codigo_barras is null or codigo_barras ~ '^[A-Za-z0-9._-]{4,32}$');

-- Único por taller, no global: dos talleres distintos venden el mismo filtro y
-- cada uno tiene su propia fila de producto.
create unique index producto_codigo_barras_key
  on public.producto (taller_id, codigo_barras)
  where codigo_barras is not null;

-- Sin esto el UPDATE devolvería 204 sin escribir nada.
grant update (codigo_barras) on public.producto to authenticated;
