# Lootopia

Monorepo Lootopia pour une application de chasses au trésor géolocalisées.

## Structure du monorepo

- `apps/mobile` : application joueurs (React Native / Expo)
- `apps/backoffice` : interface partenaires (React Web / Vite)
- `apps/admin` : console administrateurs (React Web / Vite)
- `packages/api` : backend Node.js avec NestJS
- `packages/shared` : types TypeScript partagés

## Prérequis

- Node.js LTS
- npm
- Docker Desktop (avec Docker Compose)
- Expo CLI / Expo tooling

## Installation

```bash
npm install
```

## Test rapide (mini doc)

Objectif : vérifier vite que le setup fonctionne de bout en bout.

1) Préparer l'environnement

```bash
copy .env.example .env
copy packages\api\.env.example packages\api\.env
```

2) Démarrer l'infra locale (BDD + pgAdmin + MinIO)

```bash
docker compose up -d
docker compose ps
```

Attendu : services `postgres`, `pgadmin`, `minio`, `minio-init` démarrés.

3) Vérifier la compilation

```bash
npm run build -w packages/shared
npm run build -w packages/api
npm run build -w apps/backoffice
npm run build -w apps/admin
```

Attendu : chaque commande termine sans erreur.

4) Lancer les apps une par une

```bash
npm run dev -w packages/api
npm run dev -w apps/backoffice
npm run dev -w apps/admin
npm run dev -w apps/mobile
```

Attendu :
- API NestJS démarre sur `http://localhost:3000`
- Backoffice et Admin exposent une URL locale Vite dans le terminal
- Mobile lance Expo (QR code/URL Metro)

5) Alimenter la base de données (seed)

```bash
npm run seed -w packages/api
```

Crée 1 admin, 2 partenaires, 6 joueurs, 6 chasses, étapes, zones, progressions et badges.

Comptes de test :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@lootopia.fr` | `Admin1234` |
| Partenaire | `musee@lootopia.fr` | `Partner123` |
| Partenaire | `parc@lootopia.fr` | `Partner123` |
| Joueur | `alice@example.com` | `Player123` |

6) Contrôles rapides

- API : ouvrir `http://localhost:3000` (doit répondre)
- pgAdmin : `http://localhost:5050`
- MinIO console : `http://localhost:9001`
- Admin : `http://localhost:5174` — connectez-vous avec `admin@lootopia.fr`
- Backoffice : `http://localhost:5173` — connectez-vous avec `musee@lootopia.fr`

6) Arrêter l'environnement

```bash
docker compose down
```

Reset complet des volumes :

```bash
docker compose down -v
```

## Démarrage des apps/packages

Depuis la racine du repo :

```bash
npm run dev -w packages/api
npm run dev -w apps/mobile
npm run dev -w apps/backoffice
npm run dev -w apps/admin
```

Builds de vérification :

```bash
npm run build -w packages/shared
npm run build -w packages/api
npm run build -w apps/backoffice
npm run build -w apps/admin
```

## Infrastructure Docker locale

Commandes :

```bash
docker compose up -d
docker compose down
docker compose down -v
```

Accès services :

- API backend : http://localhost:3000
- pgAdmin : http://localhost:5050
	- email : `admin@lootopia.local`
	- password : `admin`
- MinIO Console : http://localhost:9001
	- user : `minioadmin`
	- password : `minioadmin123`
- MinIO S3 API : http://localhost:9000

## Variables d'environnement

- Fichier racine : `.env.example`
- Fichier API : `packages/api/.env.example`

Map mobile : MapLibre est utilisé (pas de clé Mapbox requise).

## Flux invitation partenaire (US03)

Pour créer un compte partenaire, l'inscription directe est désactivée. Le flux est :

1. L'admin se connecte sur `http://localhost:5174`
2. Aller dans **Invitations partenaires** → saisir l'email du futur partenaire → envoyer
3. En développement, le lien d'activation s'affiche dans les **logs de la console backend** :
   ```
   [INVITATION] Destinataire: contact@musee.fr
   Lien d'activation (valable 72h) : http://localhost:5173/register?token=...
   ```
4. Ouvrir ce lien → remplir le formulaire (prénom, nom, mot de passe)
5. Se connecter sur `http://localhost:5173` avec l'email et le mot de passe choisis
