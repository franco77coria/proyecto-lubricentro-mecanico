-- ============================================================================
-- 0019 — Ampliación del catálogo: marcas y modelos
--
-- Complementa el seed de 0008. Suma tres cosas que faltaban:
--   - Las chinas que entraron al mercado en los últimos años (MG, BYD, Jetour,
--     Jaecoo, Omoda, Dongfeng, Exeed) y las marcas de camión, que un taller
--     mecánico atiende igual que un auto.
--   - El parque viejo, que es el que más entra a arreglarse: Falcon, Taunus,
--     Chevette, Duna, Daewoo, R12. Un catálogo que arranca en 2010 obliga a
--     escribir a mano justo los autos que más se ven.
--   - Las líneas de moto que faltaban.
--
-- Idempotente por los `on conflict do nothing`: se puede volver a correr.
--
-- ALCANCE, dicho de frente: esto cubre el parque argentino, no la producción
-- mundial. Es el piso. Lo que falte se carga desde la app con la opción OTROS,
-- queda como `pendiente` y se aprueba desde Ajustes. El catálogo se completa
-- con el uso, no de una vez.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Marcas
-- ---------------------------------------------------------------------------

insert into public.marca (nombre, alias, origen, estado) values
  -- Chinas de ingreso reciente
  ('MG',              array['morris']::text[],        'seed', 'aprobado'),
  ('BYD',             array[]::text[],                'seed', 'aprobado'),
  ('Great Wall',      array['gwm', 'wingle']::text[], 'seed', 'aprobado'),
  ('Dongfeng',        array['dfsk']::text[],          'seed', 'aprobado'),
  ('Jetour',          array[]::text[],                'seed', 'aprobado'),
  ('Jaecoo',          array[]::text[],                'seed', 'aprobado'),
  ('Omoda',           array[]::text[],                'seed', 'aprobado'),
  ('Exeed',           array[]::text[],                'seed', 'aprobado'),
  -- Parque viejo y marcas discontinuadas que siguen circulando
  ('Daewoo',          array[]::text[],                'seed', 'aprobado'),
  ('Rover',           array[]::text[],                'seed', 'aprobado'),
  ('Mahindra',        array[]::text[],                'seed', 'aprobado'),
  ('Smart',           array[]::text[],                'seed', 'aprobado'),
  -- Camiones y utilitarios pesados
  ('Fuso',            array['mitsubishi fuso']::text[], 'seed', 'aprobado'),
  ('Hino',            array[]::text[],                'seed', 'aprobado'),
  ('Agrale',          array[]::text[],                'seed', 'aprobado'),
  ('MAN',             array[]::text[],                'seed', 'aprobado'),
  ('DAF',             array[]::text[],                'seed', 'aprobado'),
  ('Mack',            array[]::text[],                'seed', 'aprobado'),
  ('International',   array[]::text[],                'seed', 'aprobado'),
  ('Freightliner',    array[]::text[],                'seed', 'aprobado'),
  ('Kenworth',        array[]::text[],                'seed', 'aprobado'),
  -- Motos
  ('Hero',            array[]::text[],                'seed', 'aprobado'),
  ('Haojue',          array[]::text[],                'seed', 'aprobado'),
  ('SYM',             array[]::text[],                'seed', 'aprobado'),
  ('Daelim',          array[]::text[],                'seed', 'aprobado'),
  ('Jianshe',         array[]::text[],                'seed', 'aprobado'),
  ('Appia',           array[]::text[],                'seed', 'aprobado'),
  ('Voge',            array[]::text[],                'seed', 'aprobado'),
  ('CFMoto',          array['cf moto']::text[],       'seed', 'aprobado'),
  ('Husqvarna',       array['husky']::text[],         'seed', 'aprobado'),
  ('Ducati',          array[]::text[],                'seed', 'aprobado'),
  ('Triumph',         array[]::text[],                'seed', 'aprobado'),
  ('Harley-Davidson', array['harley']::text[],        'seed', 'aprobado'),
  ('Aprilia',         array[]::text[],                'seed', 'aprobado'),
  ('Can-Am',          array['canam', 'brp']::text[],  'seed', 'aprobado'),
  ('Baccio',          array[]::text[],                'seed', 'aprobado'),
  ('Zongshen',        array[]::text[],                'seed', 'aprobado'),
  ('Yumbo',           array[]::text[],                'seed', 'aprobado'),
  ('Sunra',           array[]::text[],                'seed', 'aprobado'),
  ('Lucky Lion',      array[]::text[],                'seed', 'aprobado'),
  ('Okinoi',          array[]::text[],                'seed', 'aprobado'),
  ('Tibo',            array[]::text[],                'seed', 'aprobado')
on conflict (nombre_norm) do nothing;

-- Haval traía 'great wall' como alias porque la marca no existía por separado.
-- Ahora que existe, el alias la haría aparecer en la búsqueda de la otra y
-- son dos marcas distintas: en AR se venden Haval H6 y Great Wall Wingle como
-- cosas diferentes.
update public.marca
   set alias = array['gwm']::text[]
 where nombre_norm = public.normalizar('Haval');

-- ---------------------------------------------------------------------------
-- Modelos
-- ---------------------------------------------------------------------------

insert into public.modelo (marca_id, nombre, origen, estado)
select m.id, v.modelo, 'seed', 'aprobado'
from (values
  -- Volkswagen ------------------------------------------------------------
  ('Volkswagen','CrossFox'),('Volkswagen','SpaceFox'),('Volkswagen','Jetta'),
  ('Volkswagen','Kombi'),('Volkswagen','Transporter'),('Volkswagen','Beetle'),
  ('Volkswagen','Senda'),('Volkswagen','Gacel'),('Volkswagen','Carat'),
  ('Volkswagen','1500'),('Volkswagen','Quantum'),('Volkswagen','Santana'),
  ('Volkswagen','Pointer'),('Volkswagen','Polo Classic'),('Volkswagen','Tera'),
  ('Volkswagen','Tiguan Allspace'),('Volkswagen','Constellation'),
  ('Volkswagen','Delivery'),('Volkswagen','Worker'),
  -- Chevrolet -------------------------------------------------------------
  ('Chevrolet','Chevette'),('Chevrolet','Kadett'),('Chevrolet','Ipanema'),
  ('Chevrolet','Monza'),('Chevrolet','Corsa Wagon'),('Chevrolet','Corsa II'),
  ('Chevrolet','Joy'),('Chevrolet','D20'),('Chevrolet','C10'),
  ('Chevrolet','Silverado'),('Chevrolet','Grand Blazer'),('Chevrolet','Bolt'),
  -- Ford ------------------------------------------------------------------
  ('Ford','Falcon'),('Ford','Taunus'),('Ford','Sierra'),('Ford','Del Rey'),
  ('Ford','Orion'),('Ford','Cargo'),('Ford','F-4000'),('Ford','F-350'),
  ('Ford','Courier'),('Ford','Fusion'),('Ford','Edge'),('Ford','Mustang'),
  -- Fiat ------------------------------------------------------------------
  ('Fiat','Regatta'),('Fiat','Premio'),('Fiat','Palio Weekend'),
  ('Fiat','Bravo'),('Fiat','Brava'),('Fiat','Stilo'),('Fiat','Marea'),
  ('Fiat','Tempra'),('Fiat','128'),('Fiat','600'),('Fiat','Fastback'),
  ('Fiat','Titano'),('Fiat','Scudo'),
  -- Renault ---------------------------------------------------------------
  ('Renault','Fuego'),('Renault','21'),('Renault','4'),('Renault','Kardian'),
  ('Renault','Express'),('Renault','Laguna'),('Renault','Latitude'),
  ('Renault','Rodeo'),
  -- Peugeot ---------------------------------------------------------------
  ('Peugeot','306'),('Peugeot','309'),('Peugeot','403'),('Peugeot','404'),
  ('Peugeot','508'),('Peugeot','Rifter'),('Peugeot','Traveller'),
  ('Peugeot','Hoggar'),('Peugeot','Bipper'),('Peugeot','504 Pick Up'),
  -- Toyota ----------------------------------------------------------------
  ('Toyota','Dyna'),('Toyota','4Runner'),('Toyota','Land Cruiser Prado'),
  ('Toyota','Corolla Fielder'),('Toyota','Yaris Cross'),('Toyota','Tercel'),
  ('Toyota','Corona'),
  -- Citroën ---------------------------------------------------------------
  ('Citroën','C15'),('Citroën','AX'),('Citroën','BX'),('Citroën','Xantia'),
  ('Citroën','C3 Picasso'),('Citroën','C-Elysée'),('Citroën','C4 Picasso'),
  ('Citroën','C4 Spacetourer'),('Citroën','2CV'),('Citroën','Basalt'),
  -- Honda -----------------------------------------------------------------
  ('Honda','Pilot'),('Honda','Odyssey'),
  ('Honda','XRE'),('Honda','CBR'),('Honda','CB1'),('Honda','Storm'),
  ('Honda','Navi'),('Honda','Dio'),('Honda','Elite'),('Honda','NXR'),
  ('Honda','Bros'),('Honda','CG'),('Honda','Shadow'),('Honda','CRF'),
  ('Honda','Africa Twin'),
  -- Nissan ----------------------------------------------------------------
  ('Nissan','Terrano'),('Nissan','Pathfinder'),('Nissan','Murano'),
  ('Nissan','Altima'),('Nissan','Primera'),('Nissan','NP300'),
  ('Nissan','Qashqai'),('Nissan','Juke'),
  -- Jeep / RAM / Dodge / Chrysler -----------------------------------------
  ('Jeep','Cherokee'),('Jeep','Patriot'),('Jeep','Gladiator'),
  ('RAM','3500'),('RAM','ProMaster'),
  ('Dodge','Durango'),('Dodge','Neon'),('Dodge','Stratus'),
  ('Dodge','Avenger'),('Dodge','Grand Caravan'),
  ('Chrysler','Neon'),('Chrysler','Stratus'),('Chrysler','Sebring'),
  ('Chrysler','Voyager'),('Chrysler','Caravan'),
  -- Hyundai / Kia ---------------------------------------------------------
  ('Hyundai','Getz'),('Hyundai','Sonata'),('Hyundai','ix35'),
  ('Hyundai','Veracruz'),('Hyundai','Terracan'),('Hyundai','H100'),
  ('Hyundai','Grand i10'),('Hyundai','Staria'),('Hyundai','Porter'),
  ('Kia','Carnival'),('Kia','Stonic'),('Kia','Optima'),('Kia','Carens'),
  ('Kia','Bongo'),('Kia','K2500'),('Kia','Pregio'),('Kia','Niro'),
  -- Premium ---------------------------------------------------------------
  ('Mercedes-Benz','Clase B'),('Mercedes-Benz','Clase CLA'),
  ('Mercedes-Benz','Clase GLA'),('Mercedes-Benz','Clase GLC'),
  ('Mercedes-Benz','Clase ML'),('Mercedes-Benz','Clase S'),
  ('Mercedes-Benz','Viano'),('Mercedes-Benz','MB 180'),
  ('Mercedes-Benz','1114'),('Mercedes-Benz','1518'),('Mercedes-Benz','1620'),
  ('Mercedes-Benz','Atron'),('Mercedes-Benz','Axor'),
  ('Mercedes-Benz','Actros'),('Mercedes-Benz','O 500'),
  ('BMW','Serie 2'),('BMW','Serie 4'),('BMW','Serie 7'),
  ('BMW','X2'),('BMW','X4'),('BMW','X6'),('BMW','Z4'),
  ('Audi','A6'),('Audi','A7'),('Audi','A8'),('Audi','Q2'),('Audi','Q8'),
  ('Audi','TT'),
  ('Porsche','Panamera'),('Porsche','Boxster'),('Porsche','Cayman'),
  ('Jaguar','XJ'),('Jaguar','E-Pace'),('Jaguar','S-Type'),('Jaguar','X-Type'),
  ('Lexus','IS'),('Lexus','LS'),('Lexus','UX'),('Lexus','LX'),('Lexus','GX'),
  ('Mini','Clubman'),('Mini','Paceman'),('Mini','Cabrio'),
  ('Smart','Fortwo'),('Smart','Forfour'),
  -- Suzuki / Mitsubishi / Subaru ------------------------------------------
  ('Suzuki','Alto'),('Suzuki','Celerio'),('Suzuki','Vitara'),
  ('Suzuki','SX4'),('Suzuki','Ignis'),('Suzuki','Carry'),('Suzuki','APV'),
  ('Suzuki','Samurai'),('Suzuki','GSX'),('Suzuki','V-Strom'),
  ('Suzuki','Burgman'),('Suzuki','Address'),('Suzuki','Bandit'),
  ('Suzuki','Intruder'),('Suzuki','DR'),('Suzuki','RM'),
  ('Mitsubishi','Pajero'),('Mitsubishi','Eclipse'),('Mitsubishi','Galant'),
  ('Mitsubishi','Colt'),('Mitsubishi','Space Wagon'),('Mitsubishi','Nativa'),
  ('Mitsubishi','Triton'),('Mitsubishi','Eclipse Cross'),
  ('Subaru','Legacy'),('Subaru','WRX'),('Subaru','BRZ'),('Subaru','Tribeca'),
  -- Chinas ----------------------------------------------------------------
  ('Chery','Face'),('Chery','Orinoco'),('Chery','Tiggo 5'),
  ('Chery','Tiggo 7'),('Chery','Tiggo 8 Pro'),('Chery','Arrizo 5'),
  ('Chery','Arrizo 6'),('Chery','A1'),('Chery','A3'),
  ('Haval','H2'),('Haval','H5'),('Haval','H9'),('Haval','Dargo'),
  ('Great Wall','Wingle'),('Great Wall','Wingle 7'),('Great Wall','Hover'),
  ('Great Wall','Voleex'),('Great Wall','Poer'),
  ('BYD','Dolphin'),('BYD','Song Plus'),('BYD','Yuan Plus'),('BYD','Seal'),
  ('BYD','Han'),('BYD','Tang'),('BYD','Shark'),('BYD','King'),
  ('MG','ZS'),('MG','HS'),('MG','RX5'),('MG','MG3'),('MG','MG5'),('MG','MG6'),
  ('Jetour','Dashing'),('Jetour','X70'),('Jetour','X90'),('Jetour','T2'),
  ('Jaecoo','J5'),('Jaecoo','J7'),('Jaecoo','J8'),
  ('Omoda','C5'),('Omoda','C7'),
  ('Exeed','TXL'),('Exeed','VX'),('Exeed','RX'),
  ('Dongfeng','Rich'),('Dongfeng','Rich 6'),('Dongfeng','Glory 580'),
  ('Dongfeng','C31'),('Dongfeng','C35'),
  ('JAC','S4'),('JAC','S7'),('JAC','T5'),('JAC','T9'),('JAC','Refine'),
  ('JAC','1035'),('JAC','1045'),
  ('Baic','X25'),('Baic','X65'),('Baic','BJ40'),('Baic','M20'),
  ('Changan','CS55'),('Changan','CS75'),('Changan','Hunter'),
  ('Changan','Eado'),
  ('Geely','CK'),('Geely','MK'),('Geely','GC2'),('Geely','GX3'),
  ('Geely','Coolray'),('Geely','EC7'),
  ('Lifan','620'),('Lifan','X50'),('Lifan','Foison'),
  ('Foton','Tunland'),('Foton','View'),('Foton','Auman'),
  ('Shineray','T32'),('Shineray','X30L'),('Shineray','SY1020'),
  -- Parque viejo ----------------------------------------------------------
  ('Daewoo','Tico'),('Daewoo','Lanos'),('Daewoo','Espero'),
  ('Daewoo','Nubira'),('Daewoo','Cielo'),('Daewoo','Racer'),
  ('Daewoo','Matiz'),('Daewoo','Damas'),
  ('Rover','25'),('Rover','45'),('Rover','75'),('Rover','200'),('Rover','400'),
  ('Mahindra','Pik Up'),('Mahindra','Scorpio'),('Mahindra','Bolero'),
  ('Mahindra','XUV500'),('Mahindra','Goa'),
  ('Isuzu','Trooper'),('Isuzu','NPR'),('Isuzu','NKR'),('Isuzu','Rodeo'),
  ('SsangYong','Musso'),('SsangYong','Kyron'),('SsangYong','Tivoli'),
  ('SsangYong','Actyon Sports'),('SsangYong','Istana'),
  ('Land Rover','Evoque'),('Land Rover','Velar'),
  ('Land Rover','Range Rover Sport'),
  ('Alfa Romeo','145'),('Alfa Romeo','146'),('Alfa Romeo','155'),
  ('Alfa Romeo','164'),('Alfa Romeo','166'),('Alfa Romeo','Giulia'),
  ('Alfa Romeo','MiTo'),('Alfa Romeo','Tonale'),('Alfa Romeo','GT'),
  ('Alfa Romeo','Spider'),
  ('DS','DS5'),('DS','DS9'),
  ('Seat','Altea'),('Seat','Alhambra'),('Seat','Arona'),('Seat','Ateca'),
  ('Seat','Inca'),
  ('Skoda','Rapid'),('Skoda','Kodiaq'),('Skoda','Karoq'),('Skoda','Felicia'),
  ('Skoda','Roomster'),('Skoda','Yeti'),
  ('Daihatsu','Charade'),('Daihatsu','Cuore'),('Daihatsu','Move'),
  ('Daihatsu','Feroza'),('Daihatsu','Rocky'),('Daihatsu','Hijet'),
  ('Lada','Kalina'),('Lada','Priora'),('Lada','Vesta'),('Lada','2107'),
  ('Lada','2109'),('Lada','Nova'),
  ('Volvo','S40'),('Volvo','S80'),('Volvo','V40'),('Volvo','XC70'),
  ('Volvo','FH'),('Volvo','FM'),('Volvo','VM'),
  -- Camiones --------------------------------------------------------------
  ('Iveco','Eurocargo'),('Iveco','Trakker'),('Iveco','Vertis'),
  ('Iveco','Attack'),('Iveco','S-Way'),
  ('Scania','G410'),('Scania','P340'),('Scania','K360'),('Scania','G360'),
  ('Scania','S500'),
  ('Fuso','Canter'),('Fuso','Fighter'),
  ('Hino','300'),('Hino','500'),('Hino','700'),('Hino','Dutro'),
  ('Agrale','Marruá'),('Agrale','8500'),('Agrale','10000'),('Agrale','MA 8.5'),
  ('MAN','TGX'),('MAN','TGS'),('MAN','TGM'),('MAN','TGL'),
  ('DAF','XF'),('DAF','CF'),('DAF','LF'),('DAF','XG'),
  ('Mack','Granite'),('Mack','Anthem'),('Mack','Vision'),
  ('International','9800'),('International','Durastar'),
  ('International','Prostar'),
  ('Freightliner','Cascadia'),('Freightliner','M2'),
  ('Freightliner','Columbia'),
  ('Kenworth','T680'),('Kenworth','T800'),('Kenworth','W900'),
  -- Motos: líneas que faltaban --------------------------------------------
  ('Yamaha','YZF-R3'),('Yamaha','YZF-R6'),('Yamaha','YZF-R1'),
  ('Yamaha','Tenere'),('Yamaha','Fazer'),('Yamaha','BWS'),('Yamaha','XT'),
  ('Yamaha','WR'),('Yamaha','YZ'),('Yamaha','Virago'),('Yamaha','Tracer'),
  ('Yamaha','SZ-RR'),
  ('Kawasaki','KLR'),('Kawasaki','KX'),('Kawasaki','Vulcan'),
  ('Kawasaki','W800'),('Kawasaki','ZX-6R'),('Kawasaki','ZX-10R'),
  ('Kawasaki','Er6n'),
  ('KTM','EXC'),('KTM','SX'),('KTM','SMC'),
  ('Zanella','Sol'),('Zanella','Due'),('Zanella','Ceccato'),
  ('Zanella','Hot'),('Zanella','ZMax'),('Zanella','Exclusive'),
  ('Motomel','Max'),('Motomel','Dakar'),('Motomel','Strato'),
  ('Motomel','Custom'),('Motomel','B110'),('Motomel','XMM'),
  ('Corven','Terrain'),('Corven','TXR'),('Corven','Expert'),('Corven','DX'),
  ('Gilera','SMX'),('Gilera','Futura'),('Gilera','G1'),('Gilera','AC4'),
  ('Gilera','YL'),
  ('Guerrero','GN'),('Guerrero','Day'),('Guerrero','G90'),('Guerrero','Fox'),
  ('Keller','Crono'),('Keller','Classic'),('Keller','Jet'),('Keller','Cruise'),
  ('Mondial','MD'),('Mondial','TD'),('Mondial','FD'),('Mondial','Max'),
  ('Bajaj','Pulsar'),('Bajaj','Discover'),('Bajaj','Avenger'),
  ('Bajaj','Platina'),('Bajaj','NS'),
  ('Royal Enfield','Hunter 350'),('Royal Enfield','Interceptor'),
  ('Royal Enfield','Continental GT'),('Royal Enfield','Bullet'),
  ('Royal Enfield','Scram'),
  ('Benelli','TRK'),('Benelli','502C'),('Benelli','180S'),
  ('Beta','Boy'),('Beta','Tempo'),('Beta','Chrono'),('Beta','Alp'),
  ('Beta','Xtrainer'),
  ('Vespa','Sprint'),('Vespa','GTS'),('Vespa','LX'),
  ('Piaggio','Medley'),('Piaggio','Beverly'),('Piaggio','Fly'),
  ('Piaggio','MP3'),
  ('Kymco','Like'),('Kymco','People'),('Kymco','Downtown'),
  ('Kymco','Super 8'),
  ('Brava','Altino'),('Brava','Cargo'),('Brava','Rider'),
  ('TVS','Apache'),('TVS','Ntorq'),('TVS','Neo'),('TVS','Sport'),
  ('Hero','Hunk'),('Hero','Dash'),('Hero','Eco Deluxe'),('Hero','Ignitor'),
  ('Hero','Xpulse'),('Hero','Splendor'),('Hero','Glamour'),
  ('Haojue','DK'),('Haojue','Chopper'),('Haojue','Lindy'),('Haojue','Master'),
  ('SYM','Fiddle'),('SYM','Jet'),('SYM','Symphony'),('SYM','Crox'),
  ('SYM','Orbit'),
  ('Daelim','Daystar'),('Daelim','Roadwin'),('Daelim','Besbi'),
  ('Daelim','Citi Ace'),
  ('Jianshe','JS 125'),('Jianshe','JS 150'),
  ('Appia','Stratos'),('Appia','Terra'),('Appia','Roma'),('Appia','Fuego'),
  ('Voge','300 Rally'),('Voge','500 DS'),('Voge','525 DSX'),
  ('CFMoto','650 MT'),('CFMoto','450 SR'),('CFMoto','800 MT'),
  ('CFMoto','300 NK'),
  ('Husqvarna','Svartpilen'),('Husqvarna','Vitpilen'),('Husqvarna','TE'),
  ('Husqvarna','FE'),
  ('Ducati','Monster'),('Ducati','Multistrada'),('Ducati','Panigale'),
  ('Ducati','Scrambler'),('Ducati','Diavel'),('Ducati','Hypermotard'),
  ('Triumph','Bonneville'),('Triumph','Tiger'),('Triumph','Street Triple'),
  ('Triumph','Speed Triple'),('Triumph','Trident'),('Triumph','Scrambler'),
  ('Harley-Davidson','Sportster'),('Harley-Davidson','Iron 883'),
  ('Harley-Davidson','Street'),('Harley-Davidson','Fat Boy'),
  ('Harley-Davidson','Softail'),('Harley-Davidson','Road King'),
  ('Harley-Davidson','Pan America'),
  ('Aprilia','RS 660'),('Aprilia','Tuono'),('Aprilia','SR'),
  ('Aprilia','Shiver'),
  ('Can-Am','Outlander'),('Can-Am','Renegade'),('Can-Am','Maverick'),
  ('Can-Am','Ryker'),('Can-Am','Spyder'),
  ('Baccio','Classic'),('Baccio','PX'),('Baccio','F21'),('Baccio','VS'),
  ('Zongshen','ZS 125'),('Zongshen','RX3'),
  ('Yumbo','GS'),('Yumbo','City'),('Yumbo','Max'),('Yumbo','Eco'),
  ('Sunra','Hawk'),('Sunra','Robo'),('Sunra','Miku'),('Sunra','Leo'),
  ('Lucky Lion','Puma'),('Lucky Lion','Lion'),
  ('Okinoi','Bit'),('Okinoi','On'),
  ('Tibo','Reflex'),('Tibo','T1')
) as v(marca, modelo)
join public.marca m on m.nombre_norm = public.normalizar(v.marca)
on conflict (marca_id, nombre_norm) do nothing;
