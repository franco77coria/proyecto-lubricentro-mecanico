-- ============================================================================
-- 0042 — Catálogo Completo de Marcas, Modelos y Motorizaciones 2020-2026,
-- Fichas Técnicas Oficiales y Matriz Universal de Equivalencias de Filtros
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. MARCAS NUEVAS
-- ---------------------------------------------------------------------------

insert into public.marca (nombre, alias, origen, estado) values
  ('GWM',         array['great wall', 'gwm motors']::text[], 'seed', 'aprobado'),
  ('Tank',        array['gwm tank']::text[],                 'seed', 'aprobado'),
  ('Ora',         array['gwm ora']::text[],                  'seed', 'aprobado'),
  ('Seres',       array['seres ev', 'dfsk seres']::text[],   'seed', 'aprobado'),
  ('Cupra',       array['seat cupra']::text[],               'seed', 'aprobado'),
  ('Tesla',       array['tesla motors']::text[],             'seed', 'aprobado'),
  ('Abarth',      array['fiat abarth']::text[],              'seed', 'aprobado'),
  ('Lynk & Co',   array['lynk and co', 'lynk&co']::text[],   'seed', 'aprobado'),
  ('Zeekr',       array['zeekr ev']::text[],                 'seed', 'aprobado'),
  ('Maxus',       array['saic maxus', 'ldv']::text[],        'seed', 'aprobado'),
  ('Kaiyi',       array['cowin', 'chery kaiyi']::text[],     'seed', 'aprobado'),
  ('Karry',       array['chery karry']::text[],              'seed', 'aprobado')
on conflict (nombre_norm) do nothing;

-- ---------------------------------------------------------------------------
-- 2. MODELOS NUEVOS Y VARIANTES
-- ---------------------------------------------------------------------------

insert into public.modelo (marca_id, nombre, origen, estado)
select m.id, v.modelo, 'seed', 'aprobado'
from (values
  -- Renault
  ('Renault','Fluence GT'),('Renault','Megane E-Tech'),('Renault','Kwid E-Tech'),
  ('Renault','Kangoo E-Tech'),('Renault','Master E-Tech'),('Renault','Arkana'),
  ('Renault','Austral'),('Renault','Symbioz'),('Renault','Rafale'),
  ('Renault','Scenic E-Tech'),('Renault','Sandero RS'),

  -- Volkswagen
  ('Volkswagen','Tera'),('Volkswagen','ID.3'),('Volkswagen','ID.4'),('Volkswagen','ID.5'),
  ('Volkswagen','ID.7'),('Volkswagen','ID.Buzz'),('Volkswagen','Polo Track'),
  ('Volkswagen','Polo GTS'),('Volkswagen','Virtus GTS'),('Volkswagen','Vento GLI'),
  ('Volkswagen','Nivus GTS'),

  -- Stellantis / Fiat / Jeep / RAM
  ('Fiat','Fastback'),('Fiat','Pulse'),('Fiat','Titano'),('Fiat','500e'),('Fiat','600'),
  ('Jeep','Avenger'),('Jeep','Commander'),('Jeep','Gladiator'),
  ('RAM','Rampage'),('RAM','700'),('RAM','1500 REV'),('RAM','1500 Ramcharger'),

  -- Toyota
  ('Toyota','GR Yaris'),('Toyota','GR Corolla'),('Toyota','GR86'),
  ('Toyota','bZ4X'),('Toyota','Crown'),('Toyota','Corolla Cross'),('Toyota','Yaris Cross'),

  -- Ford
  ('Ford','Maverick'),('Ford','Bronco Sport'),('Ford','Bronco'),('Ford','Territory'),
  ('Ford','Mustang Mach-E'),('Ford','F-150 Lightning'),('Ford','E-Transit'),

  -- Chevrolet
  ('Chevrolet','Montana'),('Chevrolet','Equinox EV'),('Chevrolet','Blazer EV'),('Chevrolet','Silverado EV'),
  ('Chevrolet','Trax'),('Chevrolet','Camaro'),

  -- Peugeot & Citroën
  ('Peugeot','Landtrek'),('Peugeot','e-208'),('Peugeot','e-2008'),('Peugeot','e-3008'),
  ('Citroën','Basalt'),('Citroën','C3 Aircross'),('Citroën','C4 X'),('Citroën','C5 Aircross'),

  -- Nissan & Honda
  ('Nissan','Kicks'),('Nissan','Leaf'),('Nissan','Ariya'),('Nissan','Z'),
  ('Honda','ZR-V'),('Honda','Civic Type R'),('Honda','WR-V'),

  -- Hyundai & Kia
  ('Hyundai','Creta'),('Hyundai','HB20'),('Hyundai','Staria'),('Hyundai','Palisade'),('Hyundai','Ioniq 5'),
  ('Kia','K3'),('Kia','K4'),('Kia','Seltos'),('Kia','Sonet'),('Kia','EV6'),('Kia','EV9'),

  -- BYD
  ('BYD','Dolphin Mini'),('BYD','Seagull'),('BYD','Seal'),('BYD','Dolphin'),
  ('BYD','Yuan Pro'),('BYD','Yuan Up'),('BYD','Yuan Plus'),('BYD','Song Plus'),
  ('BYD','Song Pro'),('BYD','Shark'),('BYD','King'),('BYD','Han'),('BYD','Tang'),

  -- Chery / Omoda / Jaecoo / Exeed
  ('Chery','Tiggo 2 Pro'),('Chery','Tiggo 4 Pro'),('Chery','Tiggo 7 Pro'),
  ('Chery','Tiggo 8 Pro Max'),('Chery','Arrizo 8'),
  ('Omoda','C5'),('Omoda','C9'),('Jaecoo','J7'),('Jaecoo','J8'),

  -- GWM / Tank / Ora / Haval
  ('GWM','Tank 300'),('GWM','Tank 500'),('GWM','Poer'),('GWM','Ora 03'),
  ('Tank','300'),('Tank','500'),('Ora','03'),('Haval','H6 GT'),('Haval','Jolion Pro'),

  -- Jetour, Geely, BAIC, JAC, Changan, DFSK/Seres, MG, Cupra, Tesla
  ('Jetour','Dashing'),('Jetour','T2'),('Jetour','X70 Plus'),
  ('Geely','Coolray'),('Geely','Geometry C'),('Geely','Monjaro'),
  ('BAIC','X55 II'),('BAIC','BJ40 Plus'),
  ('JAC','JS4'),('JAC','JS6'),('JAC','T8 Pro'),('JAC','E-JS1'),
  ('Changan','CS35 Plus'),('Changan','CS55 Plus'),('Changan','UNI-T'),('Changan','Hunter'),
  ('DFSK','Glory 560'),('DFSK','Glory 580'),('DFSK','Seres 3'),
  ('Seres','3'),('Seres','5'),
  ('MG','MG4'),('MG','Cyberster'),('MG','ZS EV'),
  ('Cupra','Formentor'),('Cupra','Leon'),
  ('Tesla','Model 3'),('Tesla','Model Y'),('Tesla','Cybertruck')
) as v(marca, modelo)
join public.marca m on m.nombre_norm = public.normalizar(v.marca)
on conflict (marca_id, nombre_norm) do nothing;

-- ---------------------------------------------------------------------------
-- 3. MOTORIZACIONES COMPLETAS 2020-2026
-- ---------------------------------------------------------------------------

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
  -- Renault
  ('Renault','Fluence','2.0 Turbo GT 180cv',1998,'nafta',180),
  ('Renault','Fluence','2.0 Turbo GT2 190cv',1998,'nafta',190),
  ('Renault','Fluence GT','2.0 Turbo F4Rt 180cv',1998,'nafta',180),
  ('Renault','Fluence GT','2.0 Turbo F4Rt 190cv',1998,'nafta',190),
  ('Renault','Kardian','1.0 TCe Turbo 120cv',999,'nafta',120),
  ('Renault','Kardian','1.6 16v SCe 115cv',1598,'nafta',115),
  ('Renault','Megane E-Tech','Eléctrico EV60 220cv',null,'electrico',220),
  ('Renault','Kwid E-Tech','Eléctrico 65cv',null,'electrico',65),
  ('Renault','Duster','1.3 TCe Turbo 155cv',1332,'nafta',155),
  ('Renault','Duster','1.3 TCe Turbo 163cv',1332,'nafta',163),
  ('Renault','Duster','1.3 TCe Turbo 170cv',1332,'nafta',170),
  ('Renault','Oroch','1.3 TCe Turbo 163cv',1332,'nafta',163),
  ('Renault','Oroch','1.3 TCe Turbo 170cv',1332,'nafta',170),
  ('Renault','Sandero RS','2.0 16v 145cv',1998,'nafta',145),
  ('Renault','Sandero','2.0 16v RS 145cv',1998,'nafta',145),
  ('Renault','Arkana','1.3 TCe Turbo 140cv',1332,'nafta',140),
  ('Renault','Austral','1.2 E-Tech Full Hybrid 200cv',1199,'hibrido',200),
  ('Renault','Alaskan','2.3 Bi-Turbo dCi 190cv',2298,'diesel',190),
  ('Renault','Kangoo E-Tech','Eléctrico 120cv',null,'electrico',120),
  ('Renault','Master E-Tech','Eléctrico 140cv',null,'electrico',140),

  -- Volkswagen
  ('Volkswagen','Tera','170 TSI 1.0 Turbo 101cv',999,'nafta',101),
  ('Volkswagen','Tera','170 TSI 1.0 Turbo 116cv',999,'nafta',116),
  ('Volkswagen','Nivus','170 TSI 1.0 Turbo 95cv',999,'nafta',95),
  ('Volkswagen','Nivus','200 TSI 1.0 Turbo 116cv',999,'nafta',116),
  ('Volkswagen','Nivus','GTS 250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Nivus GTS','250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Taos','250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Taos','350 TSI 2.0 Turbo 220cv',1984,'nafta',220),
  ('Volkswagen','Amarok','2.0 TDI Monoturbo 140cv',1968,'diesel',140),
  ('Volkswagen','Amarok','2.0 TDI Biturbo 180cv',1968,'diesel',180),
  ('Volkswagen','Amarok','3.0 V6 TDI 224cv',2967,'diesel',224),
  ('Volkswagen','Amarok','3.0 V6 TDI 258cv',2967,'diesel',258),
  ('Volkswagen','Polo','Track 1.0 12v MPI 84cv',999,'nafta',84),
  ('Volkswagen','Polo','170 TSI 1.0 Turbo 95cv',999,'nafta',95),
  ('Volkswagen','Polo','Track 170 TSI 1.0 Turbo 95cv',999,'nafta',95),
  ('Volkswagen','Polo','GTS 250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Virtus','170 TSI 1.0 Turbo 95cv',999,'nafta',95),
  ('Volkswagen','Virtus','Exclusive 250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Virtus','GTS 250 TSI 1.4 Turbo 150cv',1395,'nafta',150),
  ('Volkswagen','Vento','GLI 2.0 TSI 230cv',1984,'nafta',230),
  ('Volkswagen','Vento GLI','2.0 TSI 230cv',1984,'nafta',230),
  ('Volkswagen','T-Cross','170 TSI 1.0 Turbo 95cv',999,'nafta',95),
  ('Volkswagen','T-Cross','200 TSI 1.0 Turbo 116cv',999,'nafta',116),
  ('Volkswagen','T-Cross','250 TSI 1.4 Turbo 150cv',1395,'nafta',150),

  -- Fiat
  ('Fiat','Fastback','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Fiat','Fastback','Abarth T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('Fiat','Pulse','1.3 8v Firefly 99cv',1332,'nafta',99),
  ('Fiat','Pulse','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Fiat','Pulse','Abarth T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('Fiat','Strada','1.4 8v Fire 85cv',1368,'nafta',85),
  ('Fiat','Strada','1.3 8v Firefly 99cv',1332,'nafta',99),
  ('Fiat','Strada','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Fiat','Titano','2.2 Diésel 180cv',2179,'diesel',180),
  ('Fiat','Toro','T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('Fiat','Toro','2.0 Multijet Diésel 170cv 4x4',1956,'diesel',170),
  ('Fiat','Cronos','1.3 Firefly 99cv',1332,'nafta',99),
  ('Fiat','Argo','1.3 Firefly 99cv',1332,'nafta',99),

  -- Jeep & RAM
  ('Jeep','Compass','T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('Jeep','Compass','2.0 Turbo Hurricane 4 272cv',1995,'nafta',272),
  ('Jeep','Commander','T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('Jeep','Commander','2.0 Turbo Hurricane 4 272cv',1995,'nafta',272),
  ('Jeep','Renegade','T270 1.3 Turbo 175cv',1332,'nafta',175),
  ('RAM','Rampage','2.0 Turbo Hurricane 4 272cv',1995,'nafta',272),
  ('RAM','Rampage','2.0 Multijet Diésel 170cv',1956,'diesel',170),
  ('RAM','Rampage','R/T 2.0 Hurricane 4 272cv',1995,'nafta',272),
  ('RAM','1500','3.0 I6 Hurricane Twin-Turbo 420cv',2993,'nafta',420),
  ('RAM','1500','6.2 V8 TRX Supercharged 702cv',6166,'nafta',702),
  ('RAM','1500','5.7 V8 HEMI 395cv',5654,'nafta',395),

  -- Toyota
  ('Toyota','Corolla','2.0 Dynamic Force 170cv',1987,'nafta',170),
  ('Toyota','Corolla','1.8 Hybrid 122cv',1798,'hibrido',122),
  ('Toyota','Corolla Cross','2.0 Dynamic Force 170cv',1987,'nafta',170),
  ('Toyota','Corolla Cross','1.8 Hybrid 122cv',1798,'hibrido',122),
  ('Toyota','Hilux','2.8 TDI 204cv',2755,'diesel',204),
  ('Toyota','Hilux','GR-Sport 2.8 TDI 224cv',2755,'diesel',224),
  ('Toyota','Hilux','2.4 TDI 150cv',2393,'diesel',150),
  ('Toyota','SW4','2.8 TDI 204cv',2755,'diesel',204),
  ('Toyota','Yaris','1.5 16v Dual VVT-i 107cv',1496,'nafta',107),
  ('Toyota','GR Yaris','1.6 Turbo 300cv',1618,'nafta',300),

  -- Ford
  ('Ford','Ranger','2.0 EcoBlue Turbo 170cv',1996,'diesel',170),
  ('Ford','Ranger','2.0 EcoBlue Bi-Turbo 210cv',1996,'diesel',210),
  ('Ford','Ranger','3.0 V6 Lion Turbodiesel 250cv',2993,'diesel',250),
  ('Ford','Ranger','Raptor 3.0 V6 EcoBoost Bi-Turbo 397cv',2956,'nafta',397),
  ('Ford','Maverick','2.0 EcoBoost 253cv',1995,'nafta',253),
  ('Ford','Maverick','2.5 Hybrid FHEV 191cv',2488,'hibrido',191),
  ('Ford','Bronco Sport','1.5 EcoBoost 175cv',1497,'nafta',175),
  ('Ford','Bronco Sport','2.0 EcoBoost 253cv',1995,'nafta',253),
  ('Ford','Territory','1.8 EcoBoost Turbo 185cv',1798,'nafta',185),
  ('Ford','Mustang','5.0 V8 Dark Horse 500cv',5038,'nafta',500),

  -- Chevrolet
  ('Chevrolet','Tracker','1.2 Turbo 132cv',1199,'nafta',132),
  ('Chevrolet','Montana','1.2 Turbo 132cv',1199,'nafta',132),
  ('Chevrolet','Onix','1.0 Turbo 116cv',999,'nafta',116),
  ('Chevrolet','S10','2.8 CTDi Duramax 207cv',2776,'diesel',207),
  ('Chevrolet','Trailblazer','2.8 CTDi Duramax 207cv',2776,'diesel',207),

  -- Peugeot & Citroën
  ('Peugeot','208','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Peugeot','208','1.6 16v VTi 115cv',1587,'nafta',115),
  ('Peugeot','2008','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Peugeot','2008','1.6 THP 165cv',1598,'nafta',165),
  ('Peugeot','Landtrek','2.2 Turbodiesel 180cv',2179,'diesel',180),
  ('Citroën','C3','1.0 6v Firefly 77cv',999,'nafta',77),
  ('Citroën','C3','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Citroën','C3 Aircross','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Citroën','Basalt','T200 1.0 Turbo 120cv',999,'nafta',120),
  ('Citroën','C4 Cactus','1.6 THP 165cv',1598,'nafta',165),

  -- BYD
  ('BYD','Dolphin Mini','Eléctrico 75cv',null,'electrico',75),
  ('BYD','Seal','AWD Eléctrico 530cv',null,'electrico',530),
  ('BYD','Song Pro','DM-i Híbrido Enchufable 1.5 PHEV 223cv',1498,'hibrido',223),
  ('BYD','Shark','DM-O Pick-up Híbrida Enchufable 1.5T 437cv',1498,'hibrido',437)
) as v(marca, modelo, motor, cc, comb, cv)
join public.marca ma on ma.nombre_norm = public.normalizar(v.marca)
join public.modelo mo on mo.marca_id = ma.id and mo.nombre_norm = public.normalizar(v.modelo)
on conflict (modelo_id, nombre_norm) do nothing;

-- ---------------------------------------------------------------------------
-- 4. FICHAS TÉCNICAS OFICIALES CON CAPACIDADES, VISCOSIDAD Y FILTROS
-- ---------------------------------------------------------------------------

insert into public.ficha_tecnica (
  motorizacion_id,
  aceite_litros,
  aceite_viscosidad,
  aceite_norma,
  filtro_aceite,
  filtro_aire,
  filtro_combustible,
  filtro_habitaculo,
  liquido_frenos,
  refrigerante,
  caja_tipo,
  caja_aceite,
  service_km,
  service_meses,
  notas,
  verificada,
  estado
)
select
  mt.id,
  v.litros,
  v.visc,
  v.norma,
  v.f_aceite,
  v.f_aire,
  v.f_comb,
  v.f_hab,
  v.frenos,
  v.refrig,
  v.caja_tipo,
  v.caja_aceite,
  v.km,
  v.meses,
  v.notas,
  true,
  'aprobado'
from (values
  -- Fluence GT / GT2
  ('Renault','Fluence','2.0 Turbo GT 180cv',
   5.40,'5W40','RN 0710 / RN 0700','W 75/3','C 25 115','WK 6002','CU 26 003','DOT 4','Glaceol RX D','Manual 6v PK4','75W80 NFP (2.4 L)',10000,12,'Fluence GT F4Rt 2.0 Turbo 180cv. Aceite 100% sintético obligatorio.'),
  ('Renault','Fluence','2.0 Turbo GT2 190cv',
   5.40,'5W40','RN 0710 / RN 0700','W 75/3','C 25 115','WK 6002','CU 26 003','DOT 4','Glaceol RX D','Manual 6v PK4','75W80 NFP (2.4 L)',10000,12,'Fluence GT2 F4Rt 2.0 Turbo 190cv.'),

  -- Renault 1.3 TCe
  ('Renault','Duster','1.3 TCe Turbo 163cv',
   5.50,'5W30','RN17 / RN 0710','HU 6025 z','C 25 040','WK 6002','CU 22 011','DOT 4','Glaceol RX D','CVT X-Tronic','CVT NS-3 (7.2 L)',10000,12,'H5Ht 1.3 Turbo 163/170cv inyección directa.'),
  ('Renault','Oroch','1.3 TCe Turbo 163cv',
   5.50,'5W30','RN17 / RN 0710','HU 6025 z','C 25 040','WK 6002','CU 22 011','DOT 4','Glaceol RX D','CVT X-Tronic','CVT NS-3 (7.2 L)',10000,12,'H5Ht 1.3 TCe.'),

  -- Volkswagen TSI
  ('Volkswagen','Polo','200 TSI',
   4.00,'0W20','VW 508 00 / 509 00','W 712/95','C 29 015','WK 512','CU 26 010','DOT 4','G12evo','Automática 6v AQ250','ATF VW G055 (6.0 L)',15000,12,'EA211 1.0 TSI 3 cil. Usar 0W20 norma VW 508 00.'),
  ('Volkswagen','Nivus','200 TSI 1.0 Turbo 116cv',
   4.00,'0W20','VW 508 00 / 509 00','W 712/95','C 29 015','WK 512','CU 26 010','DOT 4','G12evo','Automática 6v AQ250','ATF VW G055 (6.0 L)',15000,12,'EA211 1.0 TSI.'),
  ('Volkswagen','Taos','250 TSI 1.4 Turbo 150cv',
   4.00,'0W20','VW 508 00 / 509 00','W 712/95','C 27 009','WK 69/2','CU 26 010','DOT 4','G12evo','Automática 6v AQ250','ATF VW G055 (6.0 L)',15000,12,'EA211 1.4 TSI. Aceite 0W20 VW 508 00 de fábrica.'),
  ('Volkswagen','Amarok','3.0 V6 TDI 258cv',
   8.50,'5W30','VW 507 00 (Low SAPS)','HU 8005 z','C 31 003','PU 8028','CU 2842','DOT 4','G12evo','Automática 8v ZF 8HP50','ATF ZF Lifeguard 8 (9.0 L)',15000,12,'EA897 3.0 V6 TDI. Capacidad total 8.5 L.'),

  -- Ford Ranger
  ('Ford','Ranger','2.0 EcoBlue Turbo 170cv',
   7.10,'0W30','Ford WSS-M2C950-A / ACEA C2','HU 7043 z','C 24 057','PU 9014 z','CU 24 012','DOT 4','Motorcraft OAT','Manual 6v / Auto 10v','ATF Mercon ULV (10.5 L)',15000,12,'Panther 2.0. CORREA BAÑADA EN ACEITE: usar WSS-M2C950-A.'),
  ('Ford','Ranger','3.0 V6 Lion Turbodiesel 250cv',
   9.80,'0W30','Ford WSS-M2C950-A / ACEA C2','HU 8009 z','C 27 050','PU 10 014 z','CU 24 012','DOT 4','Motorcraft OAT','Automática 10v 10R80','ATF Mercon ULV (11.0 L)',15000,12,'Lion V6 250cv 600Nm.'),

  -- Stellantis T200 / T270
  ('Fiat','Pulse','T200 1.0 Turbo 120cv',
   3.50,'0W20','Fiat 9.55535-GS1 / Stellantis FPW','W 6025','C 24 048','WK 58/3','CU 20 006','DOT 4','Paraflu UP','CVT 7v','CVT Fluid NS-3 (6.5 L)',10000,12,'GSE T3 1.0 Turbo 120cv.'),
  ('Fiat','Fastback','T200 1.0 Turbo 120cv',
   3.50,'0W20','Fiat 9.55535-GS1 / Stellantis FPW','W 6025','C 24 048','WK 58/3','CU 20 006','DOT 4','Paraflu UP','CVT 7v','CVT Fluid NS-3 (6.5 L)',10000,12,'Fastback T200.'),
  ('Fiat','Fastback','Abarth T270 1.3 Turbo 175cv',
   4.80,'0W20','Fiat 9.55535-GS1 / MS-13340','HU 7041 z','C 22 040','WK 58/3','CU 20 006','DOT 4','Paraflu UP','Automática 6v Aisin','ATF AW-1 (6.5 L)',10000,12,'Abarth 1.3 Turbo 175cv.'),
  ('Jeep','Compass','T270 1.3 Turbo 175cv',
   4.80,'0W20','Fiat 9.55535-GS1 / MS-13340','HU 7041 z','C 22 040','WK 58/3','CU 20 006','DOT 4','Mopar OAT','Automática 6v Aisin','ATF AW-1 (6.5 L)',10000,12,'Compass T270.'),

  -- PSA 1.2 PureTech & 1.6 THP
  ('Peugeot','208','T200 1.0 Turbo 120cv',
   3.50,'0W20','Stellantis FPW9.55535/03 / Fiat GS1','W 6025','C 24 048','WK 58/3','CU 29 003-2','DOT 4','Glysantin G33','CVT 7v','CVT Fluid NS-3 (6.5 L)',10000,12,'Nuevo 208 T200 120cv.'),
  ('Peugeot','208','GT 1.2 PureTech Turbo 130cv',
   3.50,'0W20','PSA B71 2010 / PSA B71 2312','HU 7033 z','C 35 011','WK 612','CU 29 003-2','DOT 4','Glysantin G33','Automática 6v EAT6','ATF AW-1 (5.5 L)',10000,12,'EB2DTS 1.2 PureTech. CORREA EN ACEITE: norma PSA obligatoria.'),
  ('Citroën','Basalt','T200 1.0 Turbo 120cv',
   3.50,'0W20','Stellantis FPW9.55535/03 / Fiat GS1','W 6025','C 24 048','WK 58/3','CU 29 003-2','DOT 4','Glysantin G33','CVT 7v','CVT Fluid NS-3 (6.5 L)',10000,12,'Basalt GSE T3 Turbo 120cv.'),

  -- Chevrolet 1.2 Turbo & 1.0 Turbo
  ('Chevrolet','Tracker','1.2 Turbo 132cv',
   4.00,'0W20','GM dexos1 Gen 3 / Gen 2','W 7056','C 24 030','WK 58/1','CU 24 010','DOT 4','Dex-Cool Naranja','Manual 5v / Auto 6v','75W85 / Dexron VI (6.0 L)',10000,12,'CSS Prime 1.2T. CORREA EN ACEITE: usar dexos1 Gen 3.'),
  ('Chevrolet','Montana','1.2 Turbo 132cv',
   4.00,'0W20','GM dexos1 Gen 3 / Gen 2','W 7056','C 24 030','WK 58/1','CU 24 010','DOT 4','Dex-Cool Naranja','Manual 6v / Auto 6v','75W85 / Dexron VI (6.0 L)',10000,12,'Montana 1.2T CSS Prime.'),
  ('Chevrolet','Onix','1.0 Turbo 116cv',
   3.75,'0W20','GM dexos1 Gen 3 / Gen 2','W 7056','C 22 018','WK 58/1','CU 24 010','DOT 4','Dex-Cool Naranja','Manual 5v / Auto 6v','75W85 / Dexron VI (6.0 L)',10000,12,'Onix 1.0 Turbo CSS Prime.')
) as v(marca, modelo, motor, litros, visc, norma, f_aceite, f_aire, f_comb, f_hab, frenos, refrig, caja_tipo, caja_aceite, km, meses, notas)
join public.marca ma on ma.nombre_norm = public.normalizar(v.marca)
join public.modelo mo on mo.marca_id = ma.id and mo.nombre_norm = public.normalizar(v.modelo)
join public.motorizacion mt on mt.modelo_id = mo.id and mt.nombre_norm = public.normalizar(v.motor)
on conflict (motorizacion_id) do update set
  aceite_litros        = excluded.aceite_litros,
  aceite_viscosidad    = excluded.aceite_viscosidad,
  aceite_norma         = excluded.aceite_norma,
  filtro_aceite        = excluded.filtro_aceite,
  filtro_aire          = excluded.filtro_aire,
  filtro_combustible   = excluded.filtro_combustible,
  filtro_habitaculo    = excluded.filtro_habitaculo,
  liquido_frenos       = excluded.liquido_frenos,
  refrigerante         = excluded.refrigerante,
  caja_tipo            = excluded.caja_tipo,
  caja_aceite          = excluded.caja_aceite,
  service_km           = excluded.service_km,
  service_meses        = excluded.service_meses,
  notas                = excluded.notas,
  verificada           = true,
  estado               = 'aprobado',
  actualizado_en       = now();

-- ---------------------------------------------------------------------------
-- 5. MATRIZ UNIVERSAL DE EQUIVALENCIAS DE FILTROS CRUZADAS
-- ---------------------------------------------------------------------------

insert into public.filtro_equivalencia (codigo_a, codigo_b, marca_a, marca_b, tipo, estado)
values
  -- Filtros de Aceite
  ('0 451 103 314', 'W 712/52', 'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('0 451 103 314', 'WO-340',   'Bosch', 'Wega',        'aceite', 'aprobado'),
  ('0 451 103 314', 'PH5566',   'Bosch', 'Fram',        'aceite', 'aprobado'),
  ('OC 264',        'W 712/52', 'Mahle', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH5566',        'W 712/52', 'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 712/52',      'WO-340',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 451 103 365', 'W 712/95', 'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('OC 977/1',      'W 712/95', 'Mahle', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH11457',       'W 712/95', 'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 712/95',      'WO-346',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 451 103 336', 'W 75/3',   'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('OC 475',        'W 75/3',   'Mahle', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH5796',        'W 75/3',   'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 75/3',        'WO-200',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 986 452 028', 'WP 928/80','Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('OC 275',        'WP 928/80','Mahle', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH4985',        'WP 928/80','Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('WO-210',        'WP 928/80','Wega',  'Mann-Filter', 'aceite', 'aprobado'),
  ('1 457 429 249', 'HU 711/51 x','Bosch','Mann-Filter', 'aceite', 'aprobado'),
  ('CH9973ECO',     'HU 711/51 x','Fram', 'Mann-Filter', 'aceite', 'aprobado'),
  ('HU 711/51 x',   'WOE-710',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 986 B00 016', 'W 712/75', 'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('OC 90',         'W 712/75', 'Mahle', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH4722',        'W 712/75', 'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 712/75',      'WO-130',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 986 B00 001', 'W 610/3',  'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH5949',        'W 610/3',  'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 610/3',       'WO-120',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('0 986 B00 706', 'W 7056',   'Bosch', 'Mann-Filter', 'aceite', 'aprobado'),
  ('PH12148',       'W 7056',   'Fram',  'Mann-Filter', 'aceite', 'aprobado'),
  ('W 7056',        'WO-121',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('W 6025',        'WO-121',   'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('HU 7041 z',     'WOE-714',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('HU 8005 z',     'WOE-626',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('HU 7043 z',     'WOE-134',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('HU 6002 z',     'WOE-640',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),
  ('HU 7008 z',     'WOE-680',  'Mann-Filter', 'Wega',  'aceite', 'aprobado'),

  -- Filtros de Aire
  ('C 29 015',   'FAP-6014',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 27 009',   'FAP-6013',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 30 005',   'FAP-6013',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 31 003',   'FAP-6012',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 32 018',   'FAP-4873',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 25 115',   'FAP-4054',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 25 040',   'FAP-4061',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 21 002',   'FAP-4057',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 24 048',   'FAP-4065',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 22 040',   'FAP-4066',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 36 003',   'FAP-4044',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 35 011',   'FAP-4059',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 24 030',   'FAP-3294',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),
  ('C 24 057',   'FAP-4070',   'Mann-Filter', 'Wega', 'aire', 'aprobado'),

  -- Filtros de Combustible
  ('FCD-2066',   'WK 820/17',  'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('FCD-0917',   'PU 8028',    'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('FCD-0792',   'PU 8016 z',  'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('FCD-0960',   'PU 9014 z',  'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('FCI-1630',   'WK 58/3',    'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('FCI-1630',   'WK 6002',    'Wega', 'Mann-Filter', 'combustible', 'aprobado'),
  ('G10225F',    'WK 58/3',    'Fram', 'Mann-Filter', 'combustible', 'aprobado'),
  ('G10225F',    'WK 6002',    'Fram', 'Mann-Filter', 'combustible', 'aprobado')
on conflict (upper(codigo_a), upper(codigo_b)) do nothing;
