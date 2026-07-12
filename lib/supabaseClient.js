-- Table des profils animaux (un profil = un animal, lié à un compte utilisateur Supabase Auth)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Infos de base (issues de l'onboarding)
  owner_name text,
  owner_email text,
  pet_name text not null,
  species text not null check (species in ('cat', 'dog')),
  breed text,
  age text,
  gender text check (gender in ('M', 'F')),
  energy int default 3,

  -- Santé
  vaccinated boolean default false,
  sterilized boolean default false,

  -- Caractère & recherche
  temper text[] default '{}',
  seeking text[] default '{}',
  bio text,

  -- Médias (URLs vers Supabase Storage, pas des blobs locaux)
  photos jsonb default '[]',
  video jsonb,

  -- Localisation
  city text,
  lat double precision,
  lng double precision,

  -- Reproduction (imbriqué, comme dans ton App.jsx actuel)
  repro jsonb default '{"active": false, "price": "", "priceNegotiable": false, "availableFrom": "", "availableTo": "", "pedigree": false, "geneticTest": false, "reproDesc": "", "docs": []}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Un utilisateur ne peut modifier/lire que son propre profil,
-- mais tout le monde peut lire les profils pour le swipe/la carte/etc.
alter table profiles enable row level security;

create policy "Les profils sont visibles par tous les utilisateurs connectés"
  on profiles for select
  using (true);

create policy "Un utilisateur ne peut créer que son propre profil"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Un utilisateur ne peut modifier que son propre profil"
  on profiles for update
  using (auth.uid() = user_id);
