-- ══════════════════════════════════════════════════════════
-- Producció Veu — Supabase Schema
-- Executa aquest SQL al SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════

-- 1. PRODUCTES
create table if not exists productes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  producte      text,
  grup          text,
  unitats_per_palet   numeric,
  caixes_per_palet    numeric,
  unitats_per_caixa   numeric,
  kg_massa_palet      numeric,
  codi_massa          text,
  kg_farcit_palet     numeric,
  codi_farcit         text,
  dies_permesos       text,
  incompatible_amb    text,
  linies_permeses     text,
  unitats_per_carro   numeric,
  comentaris          text,
  no_classificat      text,
  transcripcio        text,
  basat_en            text
);

-- 2. RECEPTA
create table if not exists recepta (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  producte      text,
  codi_farcit           text,
  grams_per_unitat_farcit  numeric,
  merma_farcit          numeric,
  codi_massa            text,
  grams_per_unit_massa  numeric,
  merma_massa           numeric,
  kg_farcit_palet       numeric,
  kg_massa_palet        numeric,
  comentaris            text
);

-- 3. FARCIT (1 fila per matèria primera dins un codi_farcit)
create table if not exists farcit (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  codi_farcit       text,
  codi_nom_mp       text,
  kg_per_palet      numeric,
  merma             numeric
);

-- 4. MASSES (1 fila per matèria primera dins un codi_massa)
create table if not exists masses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  codi_massa        text,
  codi_nom_mp       text,
  kg_per_palet      numeric,
  merma             numeric
);

-- 5. LÍNIES
create table if not exists linies (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  linia             text,
  tipus             text,
  quantitat         numeric,
  descripcio        text,
  temps_preparacio  numeric,
  temps_neteja      numeric,
  temps_espera      numeric,
  comentaris        text
);

-- 6. FLUX
create table if not exists flux (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  producte              text,
  pas                   integer,
  dia                   numeric,
  accio                 text,
  codi_intervinent      text,
  linia                 text,
  massa                 numeric,
  temps_per_kg          text,
  minuts_min            numeric,
  minuts_max            numeric,
  temps_quantitat       numeric,
  temps_unitat          text,
  persones_necessaries  numeric,
  perfils_de_persona    text,
  es_pot_parar          text,
  frequencia            text,
  minuts_abans_produccio numeric,
  depen_de_pas          text,
  alternativa_de        integer,
  prerequisits          text,
  comentaris            text
);

-- 7. TORNS
create table if not exists torns (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  persona           text,
  torn              text,
  hora_inici        text,
  hora_fi           text,
  torn_2            text,
  hora_inici_2      text,
  hora_fi_2         text,
  actiu             text,
  tipus_personal    text,
  descans           text,
  capacitats        text,
  autoritzacions    text,
  comentaris        text
);

-- 8. GRAVACIONS (1 fila per descripció desada; només s'hi afegeix, mai es modifica ni s'esborra)
create table if not exists gravacions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  producte      text,
  text          text not null
);

-- 9. REPROCESSAMENT (resultat en espera d'un producte; no afecta les dades fins que s'aprova)
create table if not exists reprocessament (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  producte      text,
  estat         text,
  resultat      jsonb,
  error         text
);

-- ══════════════════════════════════════════════════════════
-- MIGRACIONS (executa si les taules ja existien al teu projecte)
-- ══════════════════════════════════════════════════════════
-- FLUX
ALTER TABLE flux ADD COLUMN IF NOT EXISTS accio text;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS pas integer;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS massa numeric;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS codi_intervinent text;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS minuts_min numeric;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS minuts_max numeric;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS temps_quantitat numeric;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS temps_unitat text;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS frequencia text;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS minuts_abans_produccio numeric;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS depen_de_pas text;
ALTER TABLE flux ADD COLUMN IF NOT EXISTS alternativa_de integer;
-- Canvi de tipus de temps_per_kg (numèric → text per acceptar "45 min / 150 kg")
ALTER TABLE flux ALTER COLUMN temps_per_kg TYPE text USING temps_per_kg::text;

-- PRODUCTES
ALTER TABLE productes ADD COLUMN IF NOT EXISTS transcripcio text;
ALTER TABLE productes ADD COLUMN IF NOT EXISTS basat_en text;
ALTER TABLE productes ADD COLUMN IF NOT EXISTS linies_permeses text;
ALTER TABLE productes ADD COLUMN IF NOT EXISTS unitats_per_carro numeric;
ALTER TABLE productes ADD COLUMN IF NOT EXISTS no_classificat text;
-- Els productes creats amb "Copiar" porten el producte base a la transcripció
UPDATE productes
   SET basat_en = substring(transcripcio from '^\[Duplicat de ([^\]]+)\]')
 WHERE basat_en IS NULL AND transcripcio LIKE '[Duplicat de %';

-- 265222 és el codi antic de 265722: les variants fetes llavors encara l'anomenen
UPDATE productes SET basat_en = '265722' WHERE basat_en = '265222';

-- 24382 (50 g) tenia els grams copiats del seu base de 90 g: es calculen dels seus kg per palet
UPDATE recepta SET grams_per_unitat_farcit = 24.74, grams_per_unit_massa = 44.46
 WHERE producte = '24382' AND grams_per_unitat_farcit = 54.64 AND grams_per_unit_massa = 61.94;

-- RECEPTA
ALTER TABLE recepta ADD COLUMN IF NOT EXISTS kg_farcit_palet numeric;
ALTER TABLE recepta ADD COLUMN IF NOT EXISTS kg_massa_palet numeric;

-- GRAVACIONS: copia les descripcions existents, una sola vegada i sense alterar-les
INSERT INTO gravacions (created_at, producte, text)
SELECT p.created_at, p.producte, p.transcripcio
  FROM productes p
 WHERE coalesce(p.transcripcio, '') <> ''
   AND NOT EXISTS (
     SELECT 1 FROM gravacions g
      WHERE g.producte IS NOT DISTINCT FROM p.producte AND g.text = p.transcripcio
   );

-- FARCIT
ALTER TABLE farcit ADD COLUMN IF NOT EXISTS codi_farcit text;
ALTER TABLE farcit ADD COLUMN IF NOT EXISTS kg_per_palet numeric;
-- (la columna antiga 'grams_per_unitat' es manté per retrocompatibilitat; pots eliminar-la quan vulguis:)
-- ALTER TABLE farcit DROP COLUMN IF EXISTS grams_per_unitat;

-- LINIES
ALTER TABLE linies ADD COLUMN IF NOT EXISTS quantitat numeric;

-- TORNS
ALTER TABLE torns ADD COLUMN IF NOT EXISTS torn_2 text;
ALTER TABLE torns ADD COLUMN IF NOT EXISTS hora_inici_2 text;
ALTER TABLE torns ADD COLUMN IF NOT EXISTS hora_fi_2 text;
ALTER TABLE torns ADD COLUMN IF NOT EXISTS capacitats text;
ALTER TABLE torns ADD COLUMN IF NOT EXISTS autoritzacions text;
ALTER TABLE torns ADD COLUMN IF NOT EXISTS comentaris text;

-- ══════════════════════════════════════════════════════════
-- Row Level Security (RLS) — desactivat per simplicitat
-- Si vols multi-usuari, activa RLS i afegeix polítiques
-- ══════════════════════════════════════════════════════════
alter table productes enable row level security;
alter table recepta   enable row level security;
alter table farcit    enable row level security;
alter table masses    enable row level security;
alter table linies    enable row level security;
alter table flux      enable row level security;
alter table torns     enable row level security;
alter table gravacions enable row level security;
alter table reprocessament enable row level security;

-- Política oberta (qualsevol pot llegir/escriure amb la anon key)
-- Els "drop" permeten tornar a executar aquest fitxer sencer
drop policy if exists "Allow all" on productes;
drop policy if exists "Allow all" on recepta;
drop policy if exists "Allow all" on farcit;
drop policy if exists "Allow all" on masses;
drop policy if exists "Allow all" on linies;
drop policy if exists "Allow all" on flux;
drop policy if exists "Allow all" on torns;
drop policy if exists "Allow all" on reprocessament;
create policy "Allow all" on productes for all using (true) with check (true);
create policy "Allow all" on recepta   for all using (true) with check (true);
create policy "Allow all" on farcit    for all using (true) with check (true);
create policy "Allow all" on masses    for all using (true) with check (true);
create policy "Allow all" on linies    for all using (true) with check (true);
create policy "Allow all" on flux      for all using (true) with check (true);
create policy "Allow all" on torns     for all using (true) with check (true);
create policy "Allow all" on reprocessament for all using (true) with check (true);

-- Gravacions: sense política d'update ni delete, la BD rebutja qualsevol canvi o esborrat
drop policy if exists "Read" on gravacions;
drop policy if exists "Insert" on gravacions;
create policy "Read"   on gravacions for select using (true);
create policy "Insert" on gravacions for insert with check (true);
