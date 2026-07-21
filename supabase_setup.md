 Thought Process
  Considering Workspace Cleanup
  Mám pro vás skvělou zprávu: nemusíte nic složitě klonovat nebo kopírovat z původní databáze.                                                              
                                                                                                                                                            
  Analyzoval jsem strukturu vaší původní databáze a vytvořil jsem pro vás kompletní SQL skript, který zrekonstruuje všechny tabulky, relace a optimalizované
  PostgreSQL funkce (včetně trasovacího a GPX importovacího algoritmu) pro nový projekt.                                                                    
                                                                                                                                                            
  Všechny instrukce a samotný SQL kód jsem připravil do nového souboru:                                                                                     
  👉 **supabase_setup.md**                                                                                                                                  
                                                                                                                                                            
  ### Jak postupovat:                                                                                                                                       
                                                                                                                                                            
  1. Vytvořte si nový projekt ve svém účtu na Supabase https://supabase.com/.                                                                               
  2. Otevřete v něm SQL Editor a spusťte skript ze souboru supabase_setup.md.                                                                               
  3. Vytvořte Storage Bucket s názvem  PoKraji  a nastavte mu veřejný přístup (podrobný návod je také v souboru).                                           
  4. Zkopírujte novou URL a ANON KEY z vašeho nového Supabase projektu do lokálního souboru .env.local.                                                     
                                                                                                                                                            
  Až budete mít nový Supabase projekt připravený a propojený v .env.local, dejte mi vědět a pustíme se do úpravy kódu aplikace (přesun registrace týmů do   
  administrace a skrytí trasy na mapě).                                 




# Inicializace databáze v novém Supabase projektu

Pro připojení aplikace k novému projektu v Supabase musíte nejprve spustit inicializační skript v SQL Editoru v administraci Supabase a vytvořit úložný prostor pro fotky.

## Krok 1: SQL Inicializační Skript
Otevřete **SQL Editor** ve svém novém Supabase projektu, klikněte na **New Query**, vložte následující kód a klikněte na **Run**:

```sql
-- 1. Aktivace PostGIS rozšíření (nutné pro měření vzdáleností k trase)
create extension if not exists postgis;

-- 2. Vytvoření tabulky týmů (Teams)
create table public.teams (
  id uuid default gen_random_uuid() primary key,
  team_name text not null unique,
  members text[] not null,
  is_finished boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  quiz_responses jsonb default '{}'::jsonb
);

-- 3. Vytvoření tabulky bodů zájmu (POI Points)
create table public.poi_points (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  lat double precision not null,
  lon double precision not null,
  radius_reach integer default 20,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  history_text text,
  quiz_data jsonb default '[]'::jsonb,
  title text
);

-- 4. Vytvoření tabulky pro ukládání trasy (Route Display)
create table public.route_display (
  id uuid default gen_random_uuid() primary key,
  geojson_data jsonb not null
);

-- 5. Vytvoření tabulky trasování týmů (Team Tracking)
create table public.team_tracking (
  id bigserial primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  lat_val double precision not null,
  lon_val double precision not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  distance_from_route double precision,
  session_id text
);

-- 6. Vytvoření tabulky pro odemčené POI body (Team POI Progress)
create table public.team_poi_progress (
  team_id uuid references public.teams(id) on delete cascade not null,
  poi_id uuid references public.poi_points(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (team_id, poi_id)
);

-- 7. Vytvoření tabulky pro diskuzi/vzkazy (Team Comments)
create table public.team_comments (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  team_name text not null,
  text text,
  photo_url text,
  type text default 'info'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. RPC Funkce: Ukládání GPS pingu a výpočet vzdálenosti od trasy
create or replace function public.track_team_location(
  t_id uuid,
  lat_val double precision,
  lon_val double precision,
  s_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  route_geom geography;
  point_geom geography;
  calculated_dist double precision;
begin
  -- Získání geometrie trasy (očekáváme jeden záznam)
  select st_setsrid(st_geomfromgeojson(geojson_data::text), 4326)::geography
  into route_geom
  from public.route_display
  limit 1;

  -- Vytvoření bodu (lon je X, lat je Y)
  point_geom := st_makepoint(lon_val, lat_val)::geography;

  -- Výpočet vzdálenosti v metrech
  if route_geom is not null then
    calculated_dist := st_distance(point_geom, route_geom);
  else
    calculated_dist := 0.0;
  end if;

  -- Uložení bodu do historie
  insert into public.team_tracking (team_id, lat_val, lon_val, session_id, distance_from_route)
  values (t_id, lat_val, lon_val, s_id, calculated_dist);

  -- Vrácení objektu s přesnou vzdáleností
  return jsonb_build_object('distance_from_route', calculated_dist);
end;
$$;

-- 9. RPC Funkce: Hromadný import GPX bodů
create or replace function public.import_gpx_points(
  t_id uuid,
  s_id text,
  points jsonb
)
returns void
language plpgsql
security definer
as $$
declare
  route_geom geography;
  point_record jsonb;
  lat_val double precision;
  lon_val double precision;
  calculated_dist double precision;
begin
  -- Získání geometrie trasy
  select st_setsrid(st_geomfromgeojson(geojson_data::text), 4326)::geography
  into route_geom
  from public.route_display
  limit 1;

  -- Procházení jednotlivých bodů v poli
  for point_record in select * from jsonb_array_elements(points) loop
    lat_val := (point_record->>'lat')::double precision;
    lon_val := (point_record->>'lon')::double precision;

    if route_geom is not null then
      calculated_dist := st_distance(st_makepoint(lon_val, lat_val)::geography, route_geom);
    else
      calculated_dist := 0.0;
    end if;

    insert into public.team_tracking (team_id, lat_val, lon_val, session_id, distance_from_route)
    values (t_id, lat_val, lon_val, s_id, calculated_dist);
  end loop;
end;
$$;
```

---

## Krok 2: Vytvoření Storage Bucket pro fotky
Aplikace umožňuje nahrávat fotky z trasy do diskuze. Musíte vytvořit příslušný úložný prostor:

1. V levém menu Supabase přejděte na **Storage**.
2. Klikněte na **New bucket**.
3. Pojmenujte ho přesně: **`PoKraji`**
4. Zaškrtněte možnost **Public bucket** (aby byly nahrané fotky viditelné všem uživatelům přes veřejný odkaz).
5. Klikněte na **Save**.

### Nastavení přístupových pravidel (Policies) pro Storage
Aby mohli uživatelé fotky nahrávat (upload) a mazat (delete), musíte nastavit politiky:
1. Klikněte na nový bucket **`PoKraji`** a zvolte **Policies** (nebo v menu klikněte na **Configuration** -> **Policies**).
2. Pod sekcí **Storage Policies** klikněte na **New Policy** a zvolte **For full customization**.
3. **Povolení nahrávání (Insert):**
   - Název: `Allow public uploads`
   - Allowed operations: zaškrtněte pouze **INSERT**.
   - Target roles: `public` nebo `anon`.
   - Policy definition (USING expression / WITH CHECK expression): ponechte prázdné nebo nastavte na `true`.
4. **Povolení čtení (Select):**
   - Název: `Allow public read`
   - Allowed operations: zaškrtněte pouze **SELECT**.
   - Target roles: `public` nebo `anon`.
   - Policy definition: `true`.
5. **Povolení mazání (Delete):**
   - Název: `Allow team delete own photos`
   - Allowed operations: zaškrtněte pouze **DELETE**.
   - Target roles: `public` nebo `anon`.
   - Policy definition: `true`. (Případně lze omezit dle vlastního uvážení, v jednoduché verzi stačí plný přístup `true`).
