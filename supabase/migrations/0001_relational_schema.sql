-- ============================================================================
-- Migration: schema relazionale Cartella Clinica
-- Compatibile con il sync attuale: l'app continua a scrivere blob JSON in
-- medical_kv; i trigger smistano i dati nelle tabelle relazionali.
-- Da eseguire nel SQL Editor di Supabase.
-- ============================================================================

-- ── 1. TYPES ────────────────────────────────────────────────────────────────
do $$ begin
  create type public.urgency_level as enum ('alta', 'media', 'bassa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symptom_status as enum ('da_controllare', 'controllato', 'risolto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symptom_tipo as enum ('positivo', 'medio', 'grave');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.symptom_priority as enum ('bassa', 'media', 'alta');
exception when duplicate_object then null; end $$;

-- ── 2. TABELLA UTENTI ───────────────────────────────────────────────────────
create table if not exists public.app_users (
  id          text primary key,            -- 'francesco', 'anna', ...
  name        text,
  pin_hash    text,                        -- riservato per uso futuro
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 3. TABELLA KV (esistente — creata se manca) ─────────────────────────────
create table if not exists public.medical_kv (
  user_id     text not null,
  key         text not null,
  value       jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, key)
);

-- ── 4. TABELLE RELAZIONALI ──────────────────────────────────────────────────
-- Ogni riga conserva i campi strutturati principali + extra jsonb per i campi
-- non mappati, così nessun dato va perso.

create table if not exists public.episodes (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  type        text,
  body_area   text,
  diagnosis   text,
  symptoms    text,
  outcome     text,
  start_date  date,
  end_date    date,
  stop_days   int,
  notes       text,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.watchlist_symptoms (
  id           text not null,
  user_id      text not null references public.app_users(id) on delete cascade,
  title        text,
  body_area    text,
  date_noticed date,
  context      text,
  frequency    text,
  priority     public.symptom_priority default 'media',
  status       public.symptom_status   default 'da_controllare',
  tipo         public.symptom_tipo     default 'medio',
  doctor_told  boolean default false,
  notes        text,
  extra        jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.measurements (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  type        text,
  value       numeric,
  value2      numeric,
  date        date,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.blood_analyses (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  date        date,
  lab         text,
  note        text,
  values      jsonb not null default '{}'::jsonb,   -- {marker: valore}
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.screenings (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  name        text,
  category    text,
  last_date   date,
  next_date   date,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.doctors (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  name        text,
  specialty   text,
  phone       text,
  email       text,
  address     text,
  notes       text,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.medications (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  name        text,
  dosage      text,
  frequency   text,
  active      boolean default true,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.conditions (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  name        text,
  type        text,
  chronic     boolean default false,
  extra       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.ai_analyses (
  id          text not null,
  user_id     text not null references public.app_users(id) on delete cascade,
  date        timestamptz,
  is_ai       boolean default false,
  label       text,
  insights    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

-- Indici per le query più comuni
create index if not exists idx_episodes_user_date     on public.episodes(user_id, start_date desc);
create index if not exists idx_watchlist_user_status  on public.watchlist_symptoms(user_id, status);
create index if not exists idx_measurements_user_date on public.measurements(user_id, date desc);
create index if not exists idx_blood_user_date        on public.blood_analyses(user_id, date desc);
create index if not exists idx_ai_user_date           on public.ai_analyses(user_id, date desc);

-- ── 5. FUNCTION: updated_at automatico ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['app_users','episodes','watchlist_symptoms','measurements',
                           'blood_analyses','screenings','doctors','medications',
                           'conditions','ai_analyses']
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ── 6. HELPER: cast sicuri (i dati arrivano da JSON libero) ─────────────────
create or replace function public.safe_date(v jsonb)
returns date language plpgsql immutable as $$
begin
  return (v #>> '{}')::date;
exception when others then return null;
end $$;

create or replace function public.safe_numeric(v jsonb)
returns numeric language plpgsql immutable as $$
begin
  return (v #>> '{}')::numeric;
exception when others then return null;
end $$;

create or replace function public.safe_bool(v jsonb)
returns boolean language plpgsql immutable as $$
begin
  return (v #>> '{}')::boolean;
exception when others then return null;
end $$;

-- ── 7. FUNCTION + TRIGGER: fan-out da medical_kv alle tabelle relazionali ───
-- Quando l'app sincronizza un blob (es. mcd_watchlist), il trigger lo smista
-- nella tabella relazionale corrispondente (delete + insert: lo stato del blob
-- è la fonte di verità).

create or replace function public.fanout_medical_kv()
returns trigger language plpgsql security definer as $$
declare
  item jsonb;
begin
  -- assicura che l'utente esista
  insert into public.app_users (id) values (new.user_id)
  on conflict (id) do nothing;

  if new.key = 'mcd_episodes' and jsonb_typeof(new.value) = 'array' then
    delete from public.episodes where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.episodes (id, user_id, type, body_area, diagnosis, symptoms,
                                   outcome, start_date, end_date, stop_days, notes, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'type', item->>'body_area', item->>'diagnosis', item->>'symptoms',
        item->>'outcome',
        public.safe_date(item->'start_date'), public.safe_date(item->'end_date'),
        public.safe_numeric(item->'stop_days')::int, item->>'notes',
        item - array['id','type','body_area','diagnosis','symptoms','outcome',
                     'start_date','end_date','stop_days','notes']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_watchlist' and jsonb_typeof(new.value) = 'array' then
    delete from public.watchlist_symptoms where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.watchlist_symptoms (id, user_id, title, body_area, date_noticed,
                                             context, frequency, priority, status, tipo,
                                             doctor_told, notes, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'title', item->>'body_area', public.safe_date(item->'date_noticed'),
        item->>'context', item->>'frequency',
        case when item->>'priority' in ('bassa','media','alta')
             then (item->>'priority')::public.symptom_priority else 'media' end,
        case when item->>'status' in ('da_controllare','controllato','risolto')
             then (item->>'status')::public.symptom_status else 'da_controllare' end,
        case when item->>'tipo' in ('positivo','medio','grave')
             then (item->>'tipo')::public.symptom_tipo else 'medio' end,
        coalesce(public.safe_bool(item->'doctor_told'), false), item->>'notes',
        item - array['id','title','body_area','date_noticed','context','frequency',
                     'priority','status','tipo','doctor_told','notes']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_measurements' and jsonb_typeof(new.value) = 'array' then
    delete from public.measurements where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.measurements (id, user_id, type, value, value2, date, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'type', public.safe_numeric(item->'value'),
        public.safe_numeric(item->'value2'), public.safe_date(item->'date'),
        item - array['id','type','value','value2','date']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_blood_analyses' and jsonb_typeof(new.value) = 'array' then
    delete from public.blood_analyses where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.blood_analyses (id, user_id, date, lab, note, values, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        public.safe_date(item->'date'), item->>'lab', item->>'note',
        coalesce(item->'values', '{}'::jsonb),
        item - array['id','date','lab','note','values']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_screening' and jsonb_typeof(new.value) = 'array' then
    delete from public.screenings where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.screenings (id, user_id, name, category, last_date, next_date, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'name', item->>'category',
        public.safe_date(item->'last_date'), public.safe_date(item->'next_date'),
        item - array['id','name','category','last_date','next_date']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_doctors' and jsonb_typeof(new.value) = 'array' then
    delete from public.doctors where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.doctors (id, user_id, name, specialty, phone, email, address, notes, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'name', item->>'specialty', item->>'phone', item->>'email',
        item->>'address', item->>'notes',
        item - array['id','name','specialty','phone','email','address','notes']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_medications' and jsonb_typeof(new.value) = 'array' then
    delete from public.medications where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.medications (id, user_id, name, dosage, frequency, active, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'name', item->>'dosage', item->>'frequency',
        coalesce(public.safe_bool(item->'active'), true),
        item - array['id','name','dosage','frequency','active']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_conditions' and jsonb_typeof(new.value) = 'array' then
    delete from public.conditions where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.conditions (id, user_id, name, type, chronic, extra)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        item->>'name', item->>'type',
        coalesce(public.safe_bool(item->'chronic'), false),
        item - array['id','name','type','chronic']
      ) on conflict (user_id, id) do nothing;
    end loop;

  elsif new.key = 'mcd_ai_analyses' and jsonb_typeof(new.value) = 'array' then
    delete from public.ai_analyses where user_id = new.user_id;
    for item in select * from jsonb_array_elements(new.value) loop
      insert into public.ai_analyses (id, user_id, date, is_ai, label, insights)
      values (
        coalesce(item->>'id', md5(item::text)), new.user_id,
        nullif(item->>'date','')::timestamptz,
        coalesce(public.safe_bool(item->'isAI'), false),
        item->>'label', coalesce(item->'insights', '[]'::jsonb)
      ) on conflict (user_id, id) do nothing;
    end loop;
  end if;

  return new;
exception when others then
  -- il fan-out non deve mai bloccare il sync principale
  raise warning 'fanout_medical_kv failed for key %: %', new.key, sqlerrm;
  return new;
end $$;

drop trigger if exists trg_medical_kv_fanout on public.medical_kv;
create trigger trg_medical_kv_fanout
  after insert or update on public.medical_kv
  for each row execute function public.fanout_medical_kv();

-- ── 8. RLS ──────────────────────────────────────────────────────────────────
-- L'app accede SOLO tramite l'API Vercel con la service key (che bypassa RLS).
-- Abilitare RLS senza policy per anon/authenticated = nessun accesso diretto
-- dal client: protegge i dati medici se la anon key dovesse trapelare.

do $$
declare t text;
begin
  foreach t in array array['medical_kv','app_users','episodes','watchlist_symptoms',
                           'measurements','blood_analyses','screenings','doctors',
                           'medications','conditions','ai_analyses']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    -- revoca ogni grant residuo a anon/authenticated
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Policy esplicite (per uso futuro con Supabase Auth): ogni utente vede solo
-- le proprie righe se il claim user_id corrisponde. Oggi non usate (l'app
-- passa dalla service key), ma pronte per una migrazione ad Auth nativa.
do $$
declare t text;
begin
  foreach t in array array['medical_kv','episodes','watchlist_symptoms','measurements',
                           'blood_analyses','screenings','doctors','medications',
                           'conditions','ai_analyses']
  loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format($p$create policy own_rows on public.%I
                    for all to authenticated
                    using (user_id = (auth.jwt() ->> 'app_user_id'))
                    with check (user_id = (auth.jwt() ->> 'app_user_id'))$p$, t);
  end loop;
end $$;

-- ── 9. BACKFILL: popola le tabelle relazionali dai dati kv già esistenti ────
update public.medical_kv set updated_at = updated_at;  -- riattiva il trigger su ogni riga

-- ── 10. VISTA di controllo ──────────────────────────────────────────────────
create or replace view public.v_sync_status as
select
  u.id as user_id,
  (select count(*) from public.episodes e          where e.user_id = u.id) as episodi,
  (select count(*) from public.watchlist_symptoms w where w.user_id = u.id) as sintomi,
  (select count(*) from public.measurements m       where m.user_id = u.id) as misurazioni,
  (select count(*) from public.blood_analyses b     where b.user_id = u.id) as analisi_sangue,
  (select count(*) from public.screenings s         where s.user_id = u.id) as screening,
  (select count(*) from public.ai_analyses a        where a.user_id = u.id) as analisi_ai,
  (select max(k.updated_at) from public.medical_kv k where k.user_id = u.id) as ultimo_sync
from public.app_users u;
