-- ============================================================================
-- 0043 — Motorizaciones y modelos faltantes
--
-- Completa modelos que faltaban en el catálogo argentino y agrega motorizaciones
-- que no estaban: Fluence turbo bajo el modelo "Fluence" (no solo "Fluence GT"),
-- VW Sharan, Touareg, Passat, Scirocco, Renault Laguna, Mégane II/III, etc.
--
-- Idempotente por `on conflict do nothing` tanto en modelo como motorizacion.
-- ============================================================================

-- ──────────────────────────────────────────────────
-- 1. Modelos nuevos que faltan en el catálogo
-- ──────────────────────────────────────────────────
insert into public.modelo (marca_id, nombre, estado)
select ma.id, v.modelo, 'aprobado'
from (values
  ('Volkswagen','Sharan'),
  ('Volkswagen','Touareg'),
  ('Volkswagen','Passat'),
  ('Volkswagen','Scirocco'),
  ('Renault','Laguna'),
  ('Renault','Mégane II'),
  ('Renault','Mégane III'),
  ('Renault','Symbol'),
  ('Renault','Clio Mío'),
  ('Ford','Galaxy'),
  ('Chevrolet','Astra'),
  ('Chevrolet','Vectra'),
  ('Chevrolet','Meriva'),
  ('Chevrolet','Zafira')
) as v(marca, modelo)
join public.marca ma on ma.nombre_norm = public.normalizar(v.marca)
on conflict (marca_id, nombre_norm) do nothing;

-- ──────────────────────────────────────────────────
-- 2. Motorizaciones faltantes
-- ──────────────────────────────────────────────────
insert into public.motorizacion
  (modelo_id, nombre, cilindrada_cc, combustible, potencia_cv, origen, estado)
select
  mo.id,
  v.motor,
  v.cc,
  v.comb::public.tipo_combustible,
  v.cv::smallint,
  'seed',
  'aprobado'
from (values
  -- ======================= RENAULT FLUENCE =======================
  -- Las turbo: la clave es que estén bajo el modelo "Fluence" normal
  ('Renault','Fluence','2.0 Turbo GT 180cv',1998,'nafta',180),
  ('Renault','Fluence','2.0 Turbo GT2 190cv',1998,'nafta',190),
  ('Renault','Fluence','1.5 dCi K9K 110cv',1461,'diesel',110),
  ('Renault','Fluence','2.0 16v CVT',1998,'nafta',143),

  -- ======================= VOLKSWAGEN SHARAN =======================
  ('Volkswagen','Sharan','1.4 TSI 150cv',1395,'nafta',150),
  ('Volkswagen','Sharan','2.0 TSI 200cv',1984,'nafta',200),
  ('Volkswagen','Sharan','2.0 TDI 140cv',1968,'diesel',140),
  ('Volkswagen','Sharan','2.0 TDI 170cv',1968,'diesel',170),

  -- ======================= VOLKSWAGEN TOUAREG =======================
  ('Volkswagen','Touareg','3.0 TDI 204cv',2967,'diesel',204),
  ('Volkswagen','Touareg','3.0 V6 TSI 340cv',2995,'nafta',340),
  ('Volkswagen','Touareg','3.0 TDI 286cv',2967,'diesel',286),

  -- ======================= VOLKSWAGEN PASSAT =======================
  ('Volkswagen','Passat','2.0 TSI 220cv',1984,'nafta',220),
  ('Volkswagen','Passat','2.0 TDI 150cv',1968,'diesel',150),
  ('Volkswagen','Passat','1.8 TSI 180cv',1798,'nafta',180),

  -- ======================= VOLKSWAGEN SCIROCCO =======================
  ('Volkswagen','Scirocco','1.4 TSI 160cv',1395,'nafta',160),
  ('Volkswagen','Scirocco','2.0 TSI 200cv',1984,'nafta',200),
  ('Volkswagen','Scirocco','2.0 TSI R 265cv',1984,'nafta',265),

  -- ======================= RENAULT LAGUNA =======================
  ('Renault','Laguna','2.0 16v 140cv',1998,'nafta',140),
  ('Renault','Laguna','1.9 dCi 120cv',1870,'diesel',120),

  -- ======================= RENAULT MÉGANE II =======================
  ('Renault','Mégane II','1.6 16v K4M 110cv',1598,'nafta',110),
  ('Renault','Mégane II','2.0 16v F4R 143cv',1998,'nafta',143),
  ('Renault','Mégane II','1.5 dCi K9K 105cv',1461,'diesel',105),

  -- ======================= RENAULT MÉGANE III =======================
  ('Renault','Mégane III','2.0 16v M4R 143cv',1998,'nafta',143),
  ('Renault','Mégane III','1.5 dCi K9K 110cv',1461,'diesel',110),
  ('Renault','Mégane III','2.0 Turbo RS 250cv',1998,'nafta',250),
  ('Renault','Mégane III','1.6 16v K4M 110cv',1598,'nafta',110),

  -- ======================= RENAULT SYMBOL =======================
  ('Renault','Symbol','1.6 8v K7M 105cv',1598,'nafta',105),
  ('Renault','Symbol','1.6 16v K4M 110cv',1598,'nafta',110),

  -- ======================= RENAULT CLIO MÍO =======================
  ('Renault','Clio Mío','1.2 16v D4F 75cv',1149,'nafta',75),

  -- ======================= FORD GALAXY =======================
  ('Ford','Galaxy','2.0 TDCi 150cv',1997,'diesel',150),
  ('Ford','Galaxy','2.0 EcoBoost 240cv',1999,'nafta',240),

  -- ======================= CHEVROLET ASTRA =======================
  ('Chevrolet','Astra','2.0 8v 116cv',1998,'nafta',116),
  ('Chevrolet','Astra','2.0 GLS 16v 136cv',1998,'nafta',136),
  ('Chevrolet','Astra','2.0 TD 100cv',1994,'diesel',100),

  -- ======================= CHEVROLET VECTRA =======================
  ('Chevrolet','Vectra','2.0 8v 116cv',1998,'nafta',116),
  ('Chevrolet','Vectra','2.4 16v 140cv',2384,'nafta',140),
  ('Chevrolet','Vectra','2.0 TD 100cv',1994,'diesel',100),
  ('Chevrolet','Vectra','2.0 16v GLS 140cv',1998,'nafta',140),

  -- ======================= CHEVROLET MERIVA =======================
  ('Chevrolet','Meriva','1.8 8v 102cv',1796,'nafta',102),
  ('Chevrolet','Meriva','1.7 TD 100cv',1686,'diesel',100),

  -- ======================= CHEVROLET ZAFIRA =======================
  ('Chevrolet','Zafira','2.0 16v 136cv',1998,'nafta',136),
  ('Chevrolet','Zafira','2.0 TD 100cv',1994,'diesel',100)

) as v(marca, modelo, motor, cc, comb, cv)
join public.marca ma on ma.nombre_norm = public.normalizar(v.marca)
join public.modelo mo
  on mo.marca_id = ma.id
 and mo.nombre_norm = public.normalizar(v.modelo)
on conflict (modelo_id, nombre_norm) do nothing;
