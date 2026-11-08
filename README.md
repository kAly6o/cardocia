# Cardocia

Application web de gestion personnelle de collection Pokémon : catalogue, collection,
stock à vendre, achats, ventes, import CSV, lots, boosters reconditionnés, produits
scellés, fournisseurs, historique et statistiques.

Interface **en français**, thème **sombre**, **responsive** (ordinateur, tablette,
téléphone).

## Stack technique

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict** · **Tailwind CSS v4**
- **Supabase** : PostgreSQL, Auth, Storage, Row Level Security
- Client officiel Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- Fonctions serveur Next.js pour toutes les opérations sensibles
- **Pas de Prisma, pas de NextAuth, pas de serveur Express**

## Prérequis

- Node.js ≥ 18 (testé avec Node 22)
- Un projet [Supabase](https://supabase.com) (base PostgreSQL)

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Copiez `.env.example` vers `.env.local` puis renseignez les valeurs :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Ces clés se trouvent dans **Supabase Dashboard → Project Settings → API**.
> La clé `service_role` est **secrète** : elle n'est utilisée que côté serveur
> (`src/lib/supabase/admin.ts`) et n'est **jamais** exposée au navigateur.

### 3. Appliquer les migrations SQL

Option A — SQL Editor : ouvrez le SQL Editor de Supabase et exécutez, **dans l'ordre**,
le contenu de `supabase/migrations/0001_initial_schema.sql` puis de
`supabase/migrations/0002_admin.sql`.

Option B — CLI Supabase :

```bash
npm install -g supabase
supabase login
supabase link --project-ref votre-project-ref
supabase db push
```

La migration crée :
- le schéma complet (catalogue partagé, collection, stock, achats, ventes, lots,
  boosters, produits scellés, fournisseurs, mouvements, imports, prix) ;
- les **politiques RLS** (chaque utilisateur ne voit que ses données, le catalogue est
  partagé en lecture) ;
- un déclencheur qui crée le profil à l'inscription ;
- les 10 collections officielles du Pokémon TCG (données de référence) ;
- le rôle **administrateur** (`profiles.is_admin`), protégé contre l'auto-promotion
  (migration `0002`).

Pour activer le premier administrateur, exécutez dans le SQL Editor :

```sql
update public.profiles set is_admin = true where email = 'votre-email@exemple.com';
```

### 4. Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:3000, créez votre compte, puis commencez à gérer votre
collection.
## Scripts

| Commande        | Description                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Serveur de développement       |
| `npm run build` | Build de production            |
| `npm run start` | Démarre le build de production |
| `npm run lint`  | ESLint                         |

## Architecture

```
src/
├── app/                  # Routes App Router
│   ├── (auth)/           # login, signup, mot de passe oublié…
│   ├── (app)/            # Application (protégée par la session)
│   │   ├── page.tsx      # Tableau de bord
│   │   ├── catalogue/    # Collections → extensions → cartes
│   │   ├── collection/   # Ma collection
│   │   ├── stock/        # Stock à vendre
│   │   ├── achats/       # Achats (multi-lignes + réception)
│   │   ├── ventes/       # Ventes (rentabilité)
│   │   ├── import/       # Import CSV (assistant + anti-doublons)
│   │   ├── lots/         # Lots
│   │   ├── boosters/     # Boosters reconditionnés
│   │   ├── produits/     # Produits scellés + ouvertures
│   │   ├── fournisseurs/ # Fournisseurs
│   │   ├── historique/   # Mouvements
│   │   ├── statistiques/ # Statistiques + exports CSV
│   │   ├── parametres/   # Profil + plateformes
│   │   └── admin/        # Espace d'administration (réservé aux admins)
│   └── api/              # Routes API (recherche cartes, exports CSV)
├── components/           # UI réutilisable + formulaires
├── lib/
│   ├── actions/          # Server Actions (opérations sensibles)
│   ├── queries/          # Requêtes en lecture
│   ├── import/           # Mapping CSV
│   ├── supabase/         # Clients (navigateur / serveur / admin)
│   └── …                 # types, constantes, utils, stats, csv
└── proxy.ts              # Session + protection des routes
supabase/
└── migrations/           # Migrations SQL versionnées
```

## Administration

Un espace `/admin` (visible uniquement pour les comptes `is_admin`) permet de :

- **superviser la plateforme** : statistiques globales (utilisateurs, catalogue,
  collection, stock, ventes, achats, top cartes) ;
- **gérer le catalogue** : collections, extensions et cartes (création, édition,
  suppression) ;
- **importer TCGdex** : choisir les séries à importer (collections + extensions
  + cartes, rarité et type inclus) ;
- **gérer les utilisateurs** : promouvoir/rétrograder des administrateurs, bannir ou
  débannir un compte.

Toutes les actions d'administration passent par le client `service_role` et sont
protégées côté serveur (`requireAdmin()`). La suppression d'une carte référencée par
un exemplaire utilisateur est bloquée par la base (intégrité référentielle).

## Sécurité

- **RLS** activée sur toutes les tables personnelles (`user_id = auth.uid()`).
- Le catalogue est partagé en lecture, modifiable uniquement par le rôle service.
- Le rôle administrateur ne peut pas être modifié par l'utilisateur lui-même
  (trigger SQL anti-auto-promotion).
- Les montants sont **recalculés côté serveur** (jamais de confiance aux données du
  navigateur).
- Les opérations destructives sont tracées dans l'historique (mouvements).
- Anti-doublon d'import : contrainte unique sur
  `(user_id, plateforme, type, référence externe)`.

## Import CSV

L'assistant (`/import`) gère les **achats**, **ventes** et **inventaires**. Il :
1. lit le fichier et détecte le séparateur ;
2. propose une **correspondance automatique des colonnes** (alias français/anglais
   Cardmarket inclus) modifiable manuellement ;
3. affiche un aperçu ;
4. détecte les **doublons** (même référence) et les **erreurs** ;
5. conserve l'historique des imports.

> Les colonnes et formats ne sont jamais inventés : si une colonne ne correspond à
> aucun champ, elle est ignorée ou signalée. Une correspondance de carte incertaine
> n'est **jamais** associée silencieusement.

## Import TCGdex

Le catalogue (collections, extensions, cartes) est alimenté depuis l'API publique
TCGdex. Deux façons de procéder :

- **Interface admin** : page `/admin/tcgdex` → cochez les séries à importer, puis
  « Importer la sélection ». Importe collection + extensions + cartes (rarité et
  type inclus, noms français). L'import complet peut être long sur une grosse série.
- **Ligne de commande** : `node scripts/sync-tcgdex.mjs` (séries + extensions) ou
  `node scripts/sync-tcgdex.mjs --cards` (tout le catalogue, très long).

Aucune donnée n'est inventée : sans import, le catalogue est vide.

## Déploiement

Déployable sur Vercel / Netlify / n'importe quel hôte Node.js :

1. Renseignez les variables d'environnement sur la plateforme.
2. Appliquez les migrations SQL.
3. `npm run build && npm run start`.

## Variables d'environnement

| Variable                        | Description                            |
| ------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL du projet Supabase                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (publique)                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clé service_role (serveur uniquement)  |
| `NEXT_PUBLIC_SITE_URL`          | URL publique (liens de réinitialisation) |



pour les booster reconditionné ajouté le stock d'emballage selon serie

exemple

3 booster méga evolution
etc