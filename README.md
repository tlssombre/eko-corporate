# Eko Corporate — plateforme de mise en relation agricole & logistique

Application web complète (site vitrine + trois back-offices) construite à partir du
business plan : intermédiation entre planteurs et acheteurs, avec service de transport intégré.
Un seul dossier, un seul serveur, **aucune dépendance à installer**.

---

## 1. Lancement

L'application utilise **PostgreSQL** (Supabase) pour la persistance des données.

```bash
npm install
cp .env.example .env      # puis renseigner DATABASE_URL avec la chaîne Supabase
node server.js
```

Puis ouvrir **http://localhost:4000**

Au premier démarrage, si les tables sont vides, un jeu de données de démonstration est
inséré automatiquement (8 utilisateurs, 8 offres, ~18 commandes réparties sur 6 mois,
4 transporteurs).

### 1.1 Préparer la base Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Cliquer sur **Connect** (en haut du dashboard) → onglet **Session pooler** → copier
   l'URI (format `postgresql://postgres.xxxx:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres`)
   et la mettre dans `DATABASE_URL` (fichier `.env` en local, variable d'environnement
   sur Render). ⚠️ Ne pas utiliser la connexion directe (`db.xxxx.supabase.co`) ni le
   *Transaction pooler* : tous deux nécessitent IPv6 (ou l'add-on payant "IPv4 add-on"),
   indisponible sur la plupart des réseaux/hébergeurs. Seul le *Session pooler* fonctionne
   nativement en IPv4, gratuitement.
3. Exécuter le schéma une fois, via l'éditeur SQL de Supabase **ou** en local :
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   Ce script crée les tables (`utilisateurs`, `transporteurs`, `offres`, `commandes`,
   `journal`, `sessions`, `parametres`) et la ligne de paramètres par défaut.
4. Démarrer le serveur : le jeu de démonstration est inséré automatiquement si les
   tables sont vides (voir `db/seed.js`, aussi lançable seul via `npm run seed`).

### 1.2 Déployer sur Render

1. Pousser le projet sur un dépôt Git (GitHub/GitLab) relié à Render, ou utiliser le
   fichier `render.yaml` fourni (**New → Blueprint** dans Render).
2. Renseigner la variable d'environnement `DATABASE_URL` dans les paramètres du
   service Render (Environment) avec la chaîne de connexion Supabase.
3. Render exécute `npm install` puis `npm start` (= `node server.js`) et fournit
   automatiquement la variable `PORT`.

⚠️ Le système de fichiers de Render est éphémère : ne plus utiliser `data.json` en
production (déjà remplacé par PostgreSQL dans cette version).

### Comptes de démonstration

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| Administrateur | `0700000000` | `admin123` |
| Planteur (Kouassi Yao) | `0701010101` | `demo1234` |
| Acheteur (Usine SITA Agro) | `0705050505` | `demo1234` |

Autres comptes : planteurs `0702020202`, `0703030303`, `0704040404` ;
acheteurs `0706060606`, `0707070707` — tous avec `demo1234`.

---

## 2. Ce que contient l'application

### Site vitrine (public)
- **Accueil** : positionnement, chiffres du marché en temps réel, process en 5 étapes
- **Le projet** : l'intégralité du business plan, section par section (résumé, problématique,
  solution, marché, modèle économique, opérations, marketing, organisation, juridique,
  financement, prévisions, risques, plan de lancement)
- **Marché du jour** : les lots réellement disponibles, filtrables
- **Services**, **Contrats types** (modèles planteur et acheteur consultables et imprimables), **Contact**

### Espace Planteur
Tableau de bord (revenu net, volume vendu, stock en ligne, à encaisser + graphiques),
publication d'offres avec calcul du net après commission, gestion des demandes d'achat
(accepter / refuser), suivi des livraisons, historique des paiements avec reçus, profil.

### Espace Acheteur
Tableau de bord (achats, volumes, coût moyen au kg, à régler), marché avec commande en ligne
(quantité, lieu, mode de paiement, transport Eko optionnel), suivi des commandes et des
livraisons, factures téléchargeables, profil.

### Back-office Administrateur
- **Tableau de bord** : volume et revenu du mois avec jauges d'objectif, volume d'affaires,
  commandes à traiter, graphiques (volumes, mix produits, commissions, top planteurs), journal
- **Business plan** : objectifs du business plan confrontés au réalisé, besoin de financement,
  risques et parades, plan de lancement
- **Commandes** : cycle complet — validation, expédition (affectation d'un transporteur),
  livraison, encaissement — avec contrat, facture, bon de livraison et reçu générés
- **Offres du marché**, **Logistique** (plan de chargement + transporteurs partenaires)
- **Planteurs / Acheteurs** : vérification et activation des comptes, volumes et chiffres par compte
- **Finances** : commissions, prestations transport, montants reversés aux planteurs
- **Contrats**, **Journal d'activité**, **Paramètres** (identité, commission, tarif transport,
  objectifs, besoin de financement)

---

## 3. Workflow métier

```
Offre publiée (planteur)
      ↓  commande (acheteur) — la quantité est réservée
  en_attente
      ↓  accepter / refuser (planteur)
  acceptee  ────── refusee/annulee → la quantité revient au stock
      ↓  expédier + affecter un transporteur (admin)
  en_transport
      ↓  confirmer la livraison (admin)
  livree
      ↓  encaisser (admin)
  payee
```

Chaque changement d'état est horodaté, attribué à son auteur et consultable dans la
chronologie de la commande ainsi que dans le journal d'activité.

### Calculs
- Commission Eko = `quantité × commissionParKg` (10 à 25 FCFA/kg, 15 par défaut)
- Transport = `quantité × tarifTransportParKg` (25 FCFA/kg par défaut), optionnel
- Facturé à l'acheteur = produits + transport
- Net planteur = produits − commission
- Marge Eko = commission + transport

Ces paramètres se modifient dans **Administration → Paramètres** et s'appliquent aux
nouvelles commandes.

---

## 4. Structure des fichiers

```
eko-corporate/
├── server.js            → serveur unique : API REST + fichiers statiques
├── package.json         → dépendances (pg, dotenv) et scripts npm
├── render.yaml           → configuration du déploiement Render (Blueprint)
├── .env.example          → variables d'environnement (DATABASE_URL, PORT)
├── db/
│   ├── schema.sql        → schéma PostgreSQL à exécuter sur Supabase
│   ├── seed.js            → jeu de données de démonstration (auto au 1er démarrage)
│   ├── pool.js            → connexion PostgreSQL (pg Pool)
│   └── mappers.js         → conversion lignes SQL (snake_case) ↔ objets API (camelCase)
├── lib/
│   └── motdepasse.js      → hachage/vérification des mots de passe (PBKDF2)
├── index.html           → page d'entrée (React + Babel via CDN, aucun build)
├── assets/
│   ├── logo.jpg         → logo officiel
│   └── styles.css       → charte graphique complète (vitrine + back-office)
├── app/
│   ├── base.js          → client API, formats, composants UI, graphiques SVG
│   ├── contenu.js       → business plan structuré + générateurs de documents
│   ├── vitrine.js       → site public
│   ├── auth.js          → connexion / inscription
│   ├── planteur.js      → espace planteur (+ composants partagés)
│   ├── acheteur.js      → espace acheteur
│   ├── admin.js         → back-office administrateur
│   └── application.js   → layout (sidebar, topbar), menus par rôle, routage
└── README.md
```

Aucune librairie de graphiques : les courbes, colonnes et anneaux sont des SVG écrits à la main.

---

## 5. API REST

Authentification par jeton : en-tête `Authorization: Bearer <token>`.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/inscription`, `/api/auth/connexion`, `/api/auth/deconnexion` | public |
| GET/PUT | `/api/auth/moi`, `/api/auth/profil` | connecté |
| GET | `/api/referentiel` | public |
| GET/POST | `/api/offres` | public / planteur |
| PATCH/DELETE | `/api/offres/:id` | planteur propriétaire, admin |
| GET/POST | `/api/commandes` | connecté / acheteur |
| POST | `/api/commandes/:id/{accepter\|refuser\|annuler\|expedier\|livrer\|payer}` | selon le rôle |
| GET/POST/PATCH | `/api/transporteurs` | connecté / admin |
| GET/PATCH | `/api/utilisateurs` | admin |
| GET | `/api/stats`, `/api/stats/moi` | admin / planteur-acheteur |
| GET/PUT | `/api/parametres` | admin |
| GET | `/api/journal` | admin |

Les mots de passe sont hachés (PBKDF2-SHA256, 50 000 itérations, sel aléatoire) ;
les transitions de statut et les droits sont contrôlés côté serveur.

---

## 6. Personnalisation

- **Identité, RCCM, siège, commission, objectifs** : Administration → Paramètres
  (répercutés automatiquement dans les contrats, factures et reçus)
- **Produits référencés** : constante `PRODUITS` en haut de `server.js`
- **Couleurs et typographies** : bloc `:root` de `assets/styles.css`
- **Textes du business plan** : objet `BP` dans `app/contenu.js`

## 7. Pour aller plus loin

Pistes naturelles : notifications WhatsApp/SMS à chaque changement de statut, intégration
Mobile Money pour le paiement réel, application mobile pour les planteurs, et export PDF
natif des contrats et factures (aujourd'hui impression navigateur + export texte).
