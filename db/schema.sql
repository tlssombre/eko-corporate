-- Eko Corporate — schéma PostgreSQL (Supabase)
-- À exécuter une fois dans l'éditeur SQL de Supabase (ou via `psql $DATABASE_URL -f db/schema.sql`)

create table if not exists utilisateurs (
  id              serial primary key,
  nom             text not null,
  role            text not null check (role in ('admin', 'planteur', 'acheteur')),
  telephone       text not null unique,
  localite        text default '',
  societe         text default '',
  email           text default '',
  actif           boolean not null default true,
  verifie         boolean not null default true,
  sel             text not null,
  hash            text not null,
  date_creation   timestamptz not null default now()
);

create table if not exists transporteurs (
  id              serial primary key,
  nom             text not null,
  telephone       text not null,
  vehicule        text default '',
  capacite_kg     integer default 0,
  zone            text default '',
  tarif_kg        integer default 0,
  actif           boolean not null default true
);

create table if not exists offres (
  id                  serial primary key,
  planteur_id         integer not null references utilisateurs(id),
  produit             text not null,
  quantite            integer not null check (quantite > 0),
  quantite_restante   integer not null check (quantite_restante >= 0),
  prix                integer not null check (prix > 0),
  qualite             text default 'Standard marché',
  localite            text default '',
  date_disponibilite  timestamptz not null default now(),
  statut              text not null default 'disponible',
  date_creation       timestamptz not null default now()
);

create table if not exists commandes (
  id                  serial primary key,
  reference           text not null unique,
  offre_id            integer not null references offres(id),
  acheteur_id         integer not null references utilisateurs(id),
  planteur_id         integer not null references utilisateurs(id),
  produit             text not null,
  quantite            integer not null,
  prix_kg             integer not null,
  montant_produits    integer not null,
  commission          integer not null,
  frais_transport     integer not null default 0,
  montant_total       integer not null,
  statut              text not null default 'en_attente',
  transporteur_id     integer references transporteurs(id),
  lieu_livraison      text default '',
  mode_paiement       text default 'mobile_money',
  transport_par_eko   boolean not null default true,
  date_creation       timestamptz not null default now(),
  date_acceptation    timestamptz,
  date_expedition     timestamptz,
  date_livraison      timestamptz,
  date_paiement       timestamptz,
  historique          jsonb not null default '[]'::jsonb
);

create table if not exists journal (
  id      serial primary key,
  date    timestamptz not null default now(),
  acteur  text not null,
  action  text not null,
  details text default ''
);

create table if not exists sessions (
  token           text primary key,
  utilisateur_id  integer not null references utilisateurs(id),
  date_creation   timestamptz not null default now()
);

create table if not exists parametres (
  id                      smallint primary key default 1,
  nom_entreprise          text not null default 'Eko Corporate',
  forme_juridique         text not null default 'SARL',
  rccm                    text not null default 'CI-ABJ-2026-B-00000',
  siege                   text not null default 'Abidjan, Côte d''Ivoire',
  telephone               text not null default '+225 07 00 00 00 00',
  email                   text not null default 'contact@ekocorporate.ci',
  devise                  text not null default 'FCFA',
  commission_par_kg       integer not null default 15,
  commission_min          integer not null default 10,
  commission_max          integer not null default 25,
  tarif_transport_par_kg  integer not null default 25,
  objectif_mensuel_kg     integer not null default 50000,
  objectif_revenu_mensuel integer not null default 1500000,
  besoin_financement      jsonb not null default '{"transport":300000,"communication":50000,"deplacements":100000,"administratif":100000}'::jsonb,
  constraint parametres_singleton check (id = 1)
);

create index if not exists idx_offres_planteur on offres(planteur_id);
create index if not exists idx_offres_statut on offres(statut);
create index if not exists idx_commandes_acheteur on commandes(acheteur_id);
create index if not exists idx_commandes_planteur on commandes(planteur_id);
create index if not exists idx_commandes_statut on commandes(statut);
create index if not exists idx_sessions_utilisateur on sessions(utilisateur_id);

-- Ligne unique de paramètres, indispensable au démarrage du serveur
insert into parametres (id) values (1) on conflict (id) do nothing;
