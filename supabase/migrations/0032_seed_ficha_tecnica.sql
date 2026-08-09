-- ============================================================================
-- 0032 — Seed de fichas técnicas
--
-- LEER ANTES DE AGREGAR FILAS ACÁ.
--
-- Este seed es a propósito CHICO. Cubre los motores que un lubricentro
-- argentino ve casi todos los días y sobre los que la capacidad de aceite y la
-- viscosidad son de conocimiento corriente en el rubro. No intenta cubrir las
-- 943 motorizaciones del catálogo.
--
-- El motivo es de honestidad, no de tiempo: una ficha equivocada es PEOR que
-- una ficha ausente. Si el sistema dice "4,2 L" y son 3,7, el mecánico lo carga
-- de más y el error se propaga a todos los talleres que usen el sistema. Con la
-- ficha ausente, el mecánico mira el manual como hace hoy y no pasa nada.
--
-- Los códigos de filtro NO se cargan acá. Varían por año de fabricación dentro
-- del mismo motor y equivocarlos manda a comprar la pieza que no va. Se dejan
-- para que cada taller los complete con lo que efectivamente le calzó, que es
-- información que el taller tiene y nosotros no.
--
-- `verificada = true` significa "esto salió del manual o es consenso del
-- rubro". Lo que carguen los talleres entra en false y la pantalla lo muestra
-- distinto.
-- ============================================================================

insert into public.ficha_tecnica (
  motorizacion_id, aceite_litros, aceite_viscosidad, aceite_norma,
  liquido_frenos, service_km, service_meses, verificada, estado
)
select mt.id, v.litros, v.visc, v.norma, v.frenos, v.km, v.meses, true, 'aprobado'
from (values
  -- ============ VOLKSWAGEN ============
  ('Volkswagen','Gol','1.6 8v',            3.70,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Gol Trend','1.6 8v',      3.70,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Gol Trend','1.6 16v MSI', 3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Voyage','1.6 8v',         3.70,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Voyage','1.6 16v MSI',    3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Suran','1.6 8v',          3.70,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Suran','1.6 16v MSI',     3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Fox','1.6 8v',            3.70,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Saveiro','1.6 16v MSI',   3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Polo','1.6 16v MSI',      3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Virtus','1.6 16v MSI',    3.60,'5W40','VW 502 00','DOT 4',10000,12),
  ('Volkswagen','Amarok','2.0 TDI 140',    6.30,'5W30','VW 507 00','DOT 4',15000,12),
  ('Volkswagen','Amarok','2.0 BiTDI 180',  6.30,'5W30','VW 507 00','DOT 4',15000,12),
  ('Volkswagen','Amarok','3.0 V6 TDI 258', 8.50,'5W30','VW 507 00','DOT 4',15000,12),
  ('Volkswagen','Bora','2.0 8v',           4.00,'15W40','API SN','DOT 4',10000,12),
  ('Volkswagen','Vento','2.5 20v',         5.40,'5W40','VW 502 00','DOT 4',10000,12),

  -- ============ CHEVROLET ============
  ('Chevrolet','Corsa','1.6 8v',           3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Classic','1.4 8v',         3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Classic','1.6 8v',         3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Celta','1.4 8v',           3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Prisma','1.4 8v',          3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Onix','1.4 8v',            3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Onix','1.0 Turbo',         3.75,'5W30','dexos1','DOT 4',10000,12),
  ('Chevrolet','Onix Plus','1.0 Turbo',    3.75,'5W30','dexos1','DOT 4',10000,12),
  ('Chevrolet','Cruze','1.4 Turbo',        4.00,'5W30','dexos1','DOT 4',10000,12),
  ('Chevrolet','Tracker','1.2 Turbo',      4.00,'5W30','dexos1','DOT 4',10000,12),
  ('Chevrolet','S10','2.8 CTDi',           8.30,'5W30','dexos2','DOT 4',10000,12),
  ('Chevrolet','Spin','1.8 8v',            4.00,'5W30','dexos1','DOT 4',10000,12),
  ('Chevrolet','Agile','1.4 8v',           3.50,'15W40','API SN','DOT 4',10000,12),
  ('Chevrolet','Montana','1.4 8v',         3.50,'15W40','API SN','DOT 4',10000,12),

  -- ============ FORD ============
  ('Ford','Fiesta','1.6 8v Rocam',         4.00,'15W40','API SN','DOT 4',10000,12),
  ('Ford','Fiesta','1.6 16v Sigma',        4.10,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','Ka','1.6 8v Rocam',             4.00,'15W40','API SN','DOT 4',10000,12),
  ('Ford','Ka','1.5 16v Dragon',           4.20,'5W20','WSS-M2C948','DOT 4',10000,12),
  ('Ford','Focus','2.0 16v Duratec',       4.30,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','EcoSport','1.6 16v Sigma',      4.10,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','EcoSport','2.0 16v Duratec',    4.30,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','Ranger','3.2 TDCi',             10.60,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','Ranger','2.2 TDCi',             8.00,'5W30','WSS-M2C913','DOT 4',10000,12),
  ('Ford','Ranger','2.0 EcoBlue',          7.10,'5W30','WSS-M2C950','DOT 4',15000,12),

  -- ============ FIAT ============
  ('Fiat','Uno','1.4 8v Fire Evo',         2.90,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Palio','1.4 8v Fire',           2.90,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Siena','1.4 8v Fire',           2.90,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Strada','1.4 8v Fire',          2.90,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Cronos','1.3 8v Firefly',       3.10,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Argo','1.3 8v Firefly',         3.10,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Mobi','1.0 8v Firefly',         3.10,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Toro','1.8 16v E.torQ',         4.30,'5W30','API SN','DOT 4',10000,12),
  ('Fiat','Toro','2.0 16v Multijet',       5.40,'5W30','ACEA C3','DOT 4',10000,12),
  ('Fiat','Fiorino','1.4 8v Fire',         2.90,'5W30','API SN','DOT 4',10000,12),

  -- ============ RENAULT ============
  ('Renault','Clio','1.6 16v',             4.50,'5W40','ACEA A3','DOT 4',10000,12),
  ('Renault','Logan','1.6 8v',             3.40,'15W40','API SN','DOT 4',10000,12),
  ('Renault','Logan','1.6 16v',            4.80,'5W40','ACEA A3','DOT 4',10000,12),
  ('Renault','Sandero','1.6 8v',           3.40,'15W40','API SN','DOT 4',10000,12),
  ('Renault','Sandero','1.6 16v',          4.80,'5W40','ACEA A3','DOT 4',10000,12),
  ('Renault','Sandero','1.6 16v SCe',      4.30,'5W30','RN17','DOT 4',10000,12),
  ('Renault','Stepway','1.6 16v SCe',      4.30,'5W30','RN17','DOT 4',10000,12),
  ('Renault','Duster','1.6 16v SCe',       4.30,'5W30','RN17','DOT 4',10000,12),
  ('Renault','Duster','2.0 16v',           5.40,'5W30','RN0700','DOT 4',10000,12),
  ('Renault','Kangoo','1.6 16v SCe',       4.30,'5W30','RN17','DOT 4',10000,12),
  ('Renault','Oroch','1.6 16v SCe',        4.30,'5W30','RN17','DOT 4',10000,12),

  -- ============ PEUGEOT / CITROËN ============
  ('Peugeot','206','1.4 8v',               3.00,'5W40','ACEA A3','DOT 4',10000,12),
  ('Peugeot','207','1.4 8v',               3.00,'5W40','ACEA A3','DOT 4',10000,12),
  ('Peugeot','208','1.6 16v',              4.25,'5W30','PSA B71 2290','DOT 4',10000,12),
  ('Peugeot','308','1.6 16v',              4.25,'5W30','PSA B71 2290','DOT 4',10000,12),
  ('Peugeot','Partner','1.6 16v',          4.25,'5W30','PSA B71 2290','DOT 4',10000,12),
  ('Citroën','C3','1.6 16v',               4.25,'5W30','PSA B71 2290','DOT 4',10000,12),
  ('Citroën','C4','1.6 16v',               4.25,'5W30','PSA B71 2290','DOT 4',10000,12),
  ('Citroën','Berlingo','1.6 16v',         4.25,'5W30','PSA B71 2290','DOT 4',10000,12),

  -- ============ TOYOTA ============
  ('Toyota','Corolla','1.8 16v',           4.20,'5W30','API SN','DOT 3',10000,12),
  ('Toyota','Corolla','2.0 16v Dynamic Force', 4.50,'0W20','API SN','DOT 3',10000,12),
  ('Toyota','Etios','1.5 16v',             3.40,'5W30','API SN','DOT 3',10000,12),
  ('Toyota','Yaris','1.5 16v',             3.40,'5W30','API SN','DOT 3',10000,12),
  ('Toyota','Hilux','2.8 TDI',             7.50,'5W30','API CJ-4','DOT 3',10000,12),
  ('Toyota','Hilux','3.0 D-4D',            7.50,'5W30','API CJ-4','DOT 3',10000,12),
  ('Toyota','SW4','2.8 TDI',               7.50,'5W30','API CJ-4','DOT 3',10000,12),

  -- ============ HONDA / NISSAN ============
  ('Honda','Civic','1.8 16v',              3.70,'5W30','API SN','DOT 4',10000,12),
  ('Honda','Fit','1.5 16v',                3.60,'5W30','API SN','DOT 4',10000,12),
  ('Honda','HR-V','1.8 16v',               3.70,'5W30','API SN','DOT 4',10000,12),
  ('Nissan','March','1.6 16v',             3.20,'5W30','API SN','DOT 4',10000,12),
  ('Nissan','Versa','1.6 16v',             3.20,'5W30','API SN','DOT 4',10000,12),
  ('Nissan','Kicks','1.6 16v',             4.30,'5W30','API SN','DOT 4',10000,12),
  ('Nissan','Frontier','2.3 Bi-Turbo',     7.90,'5W30','ACEA C3','DOT 4',10000,12),

  -- ============ MOTOS (las más comunes) ============
  ('Honda','Wave','110',                   0.80,'20W50','API SL','DOT 4',3000,6),
  ('Honda','Titan','150',                  1.00,'20W50','API SL','DOT 4',3000,6),
  ('Honda','Titan','160',                  1.00,'20W50','API SL','DOT 4',3000,6),
  ('Honda','Tornado','250',                1.50,'20W50','API SL','DOT 4',3000,6),
  ('Honda','XR','250',                     1.50,'20W50','API SL','DOT 4',3000,6),
  ('Yamaha','YBR','125',                   1.00,'20W50','API SL','DOT 4',3000,6),
  ('Yamaha','FZ','150',                    1.20,'20W50','API SL','DOT 4',3000,6),
  ('Yamaha','XTZ','250',                   1.50,'20W50','API SL','DOT 4',3000,6),
  ('Bajaj','Rouser','200',                 1.20,'20W50','API SL','DOT 4',3000,6),
  ('Zanella','ZB','110',                   0.80,'20W50','API SL','DOT 4',3000,6),
  ('Motomel','Blitz','110',                0.80,'20W50','API SL','DOT 4',3000,6),
  ('Corven','Energy','110',                0.80,'20W50','API SL','DOT 4',3000,6),
  ('Gilera','Smash','110',                 0.80,'20W50','API SL','DOT 4',3000,6)
) as v(marca, modelo, motor, litros, visc, norma, frenos, km, meses)
join public.marca ma on ma.nombre_norm = public.normalizar(v.marca)
join public.modelo mo on mo.marca_id = ma.id and mo.nombre_norm = public.normalizar(v.modelo)
join public.motorizacion mt on mt.modelo_id = mo.id and mt.nombre_norm = public.normalizar(v.motor)
on conflict (motorizacion_id) do nothing;
