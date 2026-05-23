# LootopiaV3 — Contexte Claude Code

> Fichier généré au scan initial (2026-05-21). Lire en < 2 min avant chaque session.
> **Suivi détaillé des US (statuts, anomalies, priorités) → [`SUIVI_US.md`](./SUIVI_US.md)** (créé 2026-05-22)

---

## Stack technique réelle

| Couche | Technologie installée | Notes |
|---|---|---|
| Mobile | React Native 0.83.2 + Expo 55 | nativewind 4, react-navigation 7 |
| État mobile | Zustand 5 | |
| Requêtes | TanStack Query 5 + Axios | |
| Cartes | @maplibre/maplibre-react-native 10 | |
| AR | @reactvision/react-viro 2.53 | |
| Backoffice/Admin | React 19 + Vite 7 + Tailwind 3 | Backoffice utilise Radix UI (dialog, select, label…) |
| Graphiques | Recharts 3 | |
| Backend | NestJS 11 | Node 20+ |
| ORM | TypeORM 0.3 | |
| BDD | PostgreSQL 15 + PostGIS 3.3 (Docker) | |
| Auth | passport-jwt + bcrypt | |
| Validation | class-validator + class-transformer | |
| Fichiers | multer (stockage local `/uploads`) | multer ^1.4.5-lts.1 ajouté dans dependencies (2026-05-21) |
| Tests API | Jest 30 + ts-jest | |
| Tests backoffice | **Vitest** (pas Jest) | déviation de la spec |
| Tests admin | ❌ Aucun test configuré | |
| Logs | winston ^3.11.0 | ajouté dans dependencies (2026-05-21) |
| Formulaires web | react-hook-form + zod | |
| Types partagés | @lootopia/shared | |
| SecureStorage | expo-secure-store ~13.0.0 | JWT migré vers SecureStore dans auth.store.ts (2026-05-21) |

---

## État de l'infrastructure

- **Docker** : `docker-compose.yml` complet — postgres, pgadmin, minio, minio-init
- **PostgreSQL 15 + PostGIS 3.3** : image `postgis/postgis:15-3.3`
- **pgAdmin** : port 5050, email admin@lootopia.local / admin
- **MinIO** : API S3 port 9000, console port 9001 (minioadmin/minioadmin123)
- **postgres/init.sql** : active `postgis` + `uuid-ossp`; tables créées par TypeORM `synchronize`
- **Seed** : `packages/api/src/database/seed.ts` (commande `npm run seed -w packages/api`)

---

## Modules backend existants (`packages/api/src/modules/`)

| Module | Fichiers présents | Tests |
|---|---|---|
| `auth` | module, controller, service, guard, strategies (jwt + jwt-optional), DTOs (login, register, register-partner, guest-login, convert-account) | spec service + strategies |
| `users` | module, controller, service, repository, entity, DTOs | spec service + entity |
| `hunts` | module, controller, service, repository, entity, DTOs, hunt-templates.constants.ts | spec service + entity |
| `steps` | module, controller, service, repository, entity, DTOs | spec service + entity |
| `progress` | module, controller, service, repository, entity, DTOs (validate-step, progress-map) | spec service + entity |
| `badges` | module, controller, service, repository, entity | spec service + entity |
| `geo` | module, service (PostGIS) | spec service |
| `files` | module, controller, service | spec service |
| `profile` | module, controller, service, DTOs (update-profile, change-password) | spec service |
| `rgpd` | module, controller, service, DTOs (update-consent, update-password) | spec service |
| `admin` | module, controller, service | spec service |
| `stats` | module, controller, service | spec service |
| `zones` | module, controller, service, repository, entity, DTOs | spec service |
| `invitations` | module, repository, service, entity, DTO (create-invitation), register-partner.dto dans auth | spec service (2026-05-23) |
| `mail` | module, service (console.log dev) | — |

**Common** : `role.enum.ts`, `@Roles()` decorator, `@CurrentUser()` decorator, `JwtAuthGuard`, `JwtOptionalAuthGuard`, `RolesGuard`, `AuthRolesGuard`, `HttpExceptionFilter`

---

## Applications frontend

### `apps/mobile` (React Native + Expo)
- **Navigation** : RootNavigator, AppNavigator, AuthNavigator
- **Screens** :
  - `auth/` : LoginScreen, RegisterScreen
  - `guest/` : ConvertAccountScreen
  - `map/` : MapScreen, HuntBottomSheet
  - `hunt/` : HuntDetailScreen, StepScreen, ARScreen ← **doublon** avec `hunts/`
  - `hunts/` : HuntDetailScreen, HuntsListScreen, StepValidationScreen, HuntCompletionScreen
  - `profile/` : ProfileScreen, BadgesScreen, SettingsScreen, SecurityScreen
- **Services** : api.ts, auth.service.ts, hunts.service.ts, hunt.service.ts (**doublon**), progress.service.ts, profile.service.ts
- **Hooks** : useAuth, useLocation, useHunts, useProfile
- **Store** : auth.store.ts, hunts.store.ts
- **Components** : Button, Input, LoadingSpinner, GpsConsentModal, HuntCard, StepCard, HuntMarker
- **Utils** : geo.utils, format.utils, error.utils

### `apps/backoffice` (React + Vite) — **Interface partenaires** (musées, villes, associations)
> Portail dédié aux partenaires organisateurs : création et gestion de leurs chasses, configuration des étapes, suivi de leurs participants et statistiques. Un partenaire ne voit que ses propres données.
- **Pages** : LoginPage, DashboardPage, HuntsPage, HuntCreatePage, HuntEditPage, StepsPage, StatsPage, SettingsPage
- **Components** : layout (Header, Sidebar, Layout), hunt (HuntForm, HuntManager, StepEditor), step (StepForm), stats (StatsViewer), zone (ZoneForm), ui/ (Radix-based components)
- **Services** : auth, hunts, steps, zones, files, stats, profile
- **Tests** : vitest — tests présents sur LoginPage, HuntsPage, StepsPage, services (auth, hunts, steps, zones, files, stats, profile), store

### `apps/admin` (React + Vite) — **Interface administrateurs internes** (équipe Out of Cache)
> Console de supervision de la plateforme entière : KPIs globaux (tous joueurs, toutes chasses), modération des partenaires, gestion des utilisateurs et badges. Session courte (2h), auth stricte. Séparée intentionnellement du backoffice (spec F03, Décision 3 DTDC).
- **Pages** : LoginPage, DashboardPage, UsersPage, PartnersPage, HuntsPage, BadgesPage
- **Components** : layout (Header, Sidebar, Layout), hunt (HuntManager, StepEditor), stats (StatsViewer)
- **Services** : auth.service, hunts.service (pas de stats, users, badges services dédiés)
- **⚠️ Pas de tests configurés**

---

## Packages partagés (`packages/shared`)

Types présents : `user.types.ts`, `hunt.types.ts`, `step.types.ts`, `progress.types.ts`, `badge.types.ts`, `api.types.ts`, `geo.types.ts` — barrel export via `src/index.ts`.

---

## Règles de travail (extrait CLAUDE_CONTEXT.md)

- **Portée stricte** : implémenter uniquement l'US demandée, aucun bonus
- **RGPD prioritaire** : `consent_gps` requis, pas de coordonnées stockées, mode invité possible, suppression en cascade
- **Stack fixe** : ne jamais substituer (pas de Prisma, Redux, Next.js, Zod côté DTO, localStorage pour JWT)
- **TypeScript strict** : pas de `any` sans justification
- **DTO NestJS** : class-validator obligatoire
- **Guards existants** : réutiliser JwtAuthGuard, JwtOptionalAuthGuard, RolesGuard, @Auth(), @CurrentUser()
- **Tests** : Jest pour API, Vitest pour backoffice, viser couverture utile de l'US
- **Fichiers partagés impactés** : signaler explicitement avant de modifier app.module.ts, types partagés, etc.

---

## Backlog — État estimé au scan initial

> Légende : ✅ Implémentée | ⚠️ Partielle | ❌ Absente | ❓ Indéterminable sans lire le code

| US | Titre | Statut | Raison |
|---|---|---|---|
| US01 | Connexion partenaire (backoffice) | ✅ | LoginPage + auth.service + auth.store présents |
| US02 | Connexion administrateur | ✅ | LoginPage admin + rôle ADMIN dans guards |
| US03 | Inscription/compte partenaire | ✅ | Flux invitation (2026-05-23) : POST /admin/invitations → token 72h → /register?token= → POST /auth/register/partner |
| US04 | Accès joueur en mode invité | ✅ | guest-login.dto + ConvertAccountScreen + GpsConsentModal |
| US05 | Gestion des rôles et autorisations | ✅ | RolesGuard, AuthRolesGuard, role.enum.ts |
| US06 | Voir les chasses sur une carte | ✅ | MapScreen + HuntMarker + useLocation + GpsConsentModal |
| US07 | Rechercher une chasse | ⚠️ | HuntsListScreen présent, filtres à vérifier |
| US08 | Consulter le détail d'une chasse | ✅ | HuntDetailScreen (deux versions) |
| US09 | Rejoindre une chasse | ✅ | progress.service + POST /hunts/:id/join |
| US10 | Voir la progression sur la carte | ⚠️ | MapScreen présent, intégration progression à vérifier |
| US11 | Valider une étape par proximité | ✅ | StepValidationScreen + validate-step.dto + geo.service |
| US12 | Scanner une étape en RA simple | ⚠️ | ARScreen présent, logique viro à vérifier |
| US13 | Voir mes points et badges | ✅ | ProfileScreen + BadgesScreen |
| US14 | Sauvegarder ma progression | ✅ | progress module complet en base |
| US15 | Multilangue FR/EN | ❌ | Aucune lib i18n dans aucun package.json |
| US16 | Dashboard partenaire | ✅ | DashboardPage backoffice |
| US17 | Créer une chasse | ✅ | HuntCreatePage + HuntForm + POST /hunts |
| US18 | Modifier une chasse | ✅ | HuntEditPage + PATCH /hunts/:id |
| US19 | Supprimer une chasse | ✅ | HuntsPage + DELETE /hunts/:id |
| US20 | Templates de chasse | ✅ | hunt-templates.constants.ts + POST /hunts/from-template |
| US21 | Ajouter un plan ou une image | ✅ | file-upload.tsx + files.service (backoffice) + files module API |
| US22 | Définir des zones sur le plan | ✅ | ZoneForm + zones.service (backoffice) + zones module API |
| US23 | Gérer les étapes d'une chasse | ✅ | StepsPage + StepEditor + StepForm + steps module API |
| US24 | Configurer les éléments RA d'une étape | ⚠️ | StepEditor présent, champ ar_content à vérifier |
| US25 | Statistiques de base d'une chasse | ✅ | StatsPage + stats.service + GET /hunts/:id/stats |
| US26 | Liste des participants | ✅ | GET /hunts/:id/participants dans hunts.controller |
| US27 | Dashboard global admin | ✅ | DashboardPage admin |
| US28 | Métriques globales (joueurs/chasses) | ✅ | stats module + GET /admin/stats |
| US29 | Taux de participation/complétion | ✅ | stats.service |
| US30 | API d'authentification | ✅ | POST /auth/login, register, guest, PATCH /auth/convert |
| US31 | API des chasses | ✅ | CRUD complet + templates + stats + participants |
| US32 | API des étapes | ✅ | CRUD nested sous /hunts/:huntId/steps |
| US33 | Gestion progression joueur | ✅ | progress module complet |
| US34 | Validation géographique | ✅ | geo.service avec ST_DWithin |
| US35 | Badges et points | ✅ | badges module + attribution via progress |
| US36 | Upload de fichiers | ⚠️ | multer absent de package.json mais fonctionnel via transitive dep de @nestjs/platform-express ; stockage local /uploads/ |
| US37 | Exposer les statistiques | ✅ | GET /stats/hunts |
| US38 | Schéma de base de données | ✅ | Entités TypeORM + PostGIS + init.sql |
| US39 | Sécuriser les endpoints | ✅ | Guards + Throttler + CORS + ValidationPipe |
| US40 | Conformité RGPD minimale | ✅ | rgpd module + consent_gps + suppression cascade |
| US47 | Connexion et inscription (mobile) | ✅ | LoginScreen + RegisterScreen + auth.service |
| US48 | Mode invité (guest login) | ✅ | guest-login.dto API + ConvertAccountScreen mobile |
| US49 | Conversion compte invité → réel | ✅ | ConvertAccountScreen + PATCH /auth/convert |
| US50 | Carte interactive avec position | ✅ | MapScreen + useLocation + GpsConsentModal |
| US51 | Affichage des chasses sur la carte | ✅ | MapScreen + HuntMarker + HuntBottomSheet |
| US52 | Vue liste des chasses avec filtres | ✅ | HuntsListScreen |
| US53 | Rejoindre une chasse + étapes | ✅ | HuntDetailScreen + progress.service |
| US54 | Validation d'étape par GPS | ✅ | StepValidationScreen + POST validate |
| US55 | Validation d'étape par QR Code | ❌ | StepScreen.tsx = stub `return null`. Aucune logique QR. expo-camera présent mais non utilisé. |
| US56 | Validation d'étape par Quiz | ❌ | Aucun composant quiz. StepScreen.tsx = stub vide. |
| US57 | Validation d'étape par photo | ❌ | StepScreen.tsx = stub `return null`. Aucune logique photo. expo-camera présent mais non utilisé. |
| US58 | Récapitulatif fin de chasse | ✅ | HuntCompletionScreen |
| US59 | Page de profil joueur | ✅ | ProfileScreen + GET /me/profile |
| US60 | Collection badges + historique | ✅ | BadgesScreen — PR #49 mergé |
| US61 | Modification profil + consentement GPS | ✅ | SettingsScreen — PR #50 mergé |
| US62 | Sécurité du compte et suppression | ✅ | SecurityScreen — PR #51 mergé |

---

## Plan d'audit détaillé — Sessions recommandées

### Session 2 — Audit des anomalies critiques
1. **Doublon mobile** : `screens/hunt/HuntDetailScreen.tsx` vs `screens/hunts/HuntDetailScreen.tsx` — identifier lequel est actif dans la navigation
2. **Doublon service** : `hunt.service.ts` vs `hunts.service.ts` dans mobile/src/services/
3. **multer manquant** : vérifier si files.service.ts fonctionne réellement (upload local vs MinIO)
4. **expo-secure-store absent** : JWT stocké en AsyncStorage = non conforme RGPD/sécurité

### Session 3 — Audit backend (logique métier réelle)
1. Lire `hunts.service.ts` : templates, stats, participants
2. Lire `progress.service.ts` : logique validate + badges
3. Lire `profile.service.ts` vs `rgpd.service.ts` : overlap possible
4. Lire `auth.service.ts` : guest login + convert account

### Session 4 — Audit mobile (navigation et flux complets)
1. Lire `RootNavigator.tsx` + `AppNavigator.tsx` : routing réel
2. Vérifier `StepScreen.tsx` et `StepValidationScreen.tsx` : gestion des types (GPS/QR/quiz/photo)
3. Vérifier `ARScreen.tsx` : intégration react-viro réelle ou stub
4. Vérifier `auth.store.ts` : gestion du mode invité

### Session 5 — Audit backoffice/admin
1. Vérifier `ZoneForm.tsx` : dessin de zones interactif (US22) ou formulaire simple
2. Vérifier `DashboardPage.tsx` (backoffice) : KPI réels ou maquette
3. Vérifier admin : store/services manquants (users, badges, partners)
4. Vérifier `SettingsPage.tsx` backoffice

### Session 6 — US restantes / manquantes
- **US15** (multilangue) : totalement absent, nécessite i18next ou expo-localization
- **US03** (inscription partenaire) : ✅ Implémenté 2026-05-23 — flux invitation complet
- **US56** (quiz) : logique non trouvée, à implémenter dans StepScreen

---

## Fichiers clés à lire en priorité

1. `packages/api/src/app.module.ts` — bootstrap et modules déclarés
2. `packages/api/src/modules/auth/auth.service.ts` — login, register, guest, convert
3. `packages/api/src/modules/progress/progress.service.ts` — cœur du gameplay
4. `packages/api/src/modules/hunts/hunts.service.ts` — CRUD + templates + stats
5. `packages/api/src/modules/geo/geo.service.ts` — PostGIS queries
6. `apps/mobile/src/navigation/RootNavigator.tsx` — routing mobile réel
7. `apps/mobile/src/screens/hunt/StepScreen.tsx` — types de validation
8. `apps/mobile/src/store/auth.store.ts` — état auth + mode invité
9. `apps/backoffice/src/pages/DashboardPage.tsx` — KPI partenaire
10. `apps/admin/src/pages/DashboardPage.tsx` — KPI admin
11. `packages/shared/src/types/hunt.types.ts` — types partagés centraux
12. `packages/api/src/modules/files/files.service.ts` — upload local ou MinIO ?

---

## ⚠️ Points d'attention — Faits vérifiés (audit 2026-05-21)

| # | Problème | Statut | Impact réel | Fichiers concernés |
|---|---|---|---|---|
| 1 | **Doublon HuntDetailScreen** | ✅ Résolu | Dead code supprimé. `screens/hunt/HuntDetailScreen.tsx` supprimé (2026-05-21). Seul `screens/hunts/HuntDetailScreen` subsiste. | supprimé |
| 2 | **Doublon hunt.service / hunts.service** | ✅ Résolu | Dead code supprimé. `mobile/src/services/hunts.service.ts` supprimé (2026-05-21). Seul `hunt.service.ts` subsiste. | supprimé |
| 3 | **multer absent de package.json** | ✅ Résolu | `"multer": "^1.4.5-lts.1"` ajouté dans `dependencies` (2026-05-21). `@types/multer` était déjà en devDeps. | `packages/api/package.json` |
| 4 | **expo-secure-store absent** | ✅ Résolu | `"expo-secure-store": "~13.0.0"` ajouté dans `apps/mobile/package.json`. TOKEN_KEY migré vers `SecureStore.getItemAsync/setItemAsync/deleteItemAsync` dans `auth.store.ts`. AsyncStorage conservé pour CONSENT_GPS_KEY et DEVICE_TOKEN_KEY. (2026-05-21) | `apps/mobile/package.json`, `auth.store.ts` |
| 5 | **Winston absent de package.json** | ✅ Résolu | `"winston": "^3.11.0"` ajouté dans `dependencies` (2026-05-21). | `packages/api/package.json` |
| 6 | **Vitest dans backoffice** | ⚠️ Déviation de spec | Vitest utilisé au lieu de Jest (imposé dans CLAUDE_CONTEXT). | `apps/backoffice/package.json` |
| 7 | **Admin sans tests** | ❌ Confirmé | Aucune config de test dans `apps/admin/`. | `apps/admin/` |
| 8 | **US15 multilangue** | ❌ Absent | Aucune lib i18n dans aucun package.json. | Tous les packages |
| 9 | **US03 inscription partenaire** | ❌ Absente | `LoginPage.tsx` backoffice = formulaire login seul (email + password). Aucun formulaire d'inscription, aucun onglet register. US03 non implémentée. | `apps/backoffice/src/pages/LoginPage.tsx` |
| 10 | **StepScreen.tsx stub complet** | ❌ Cassé | `screens/hunt/StepScreen.tsx` = stub `// TODO, return null`. Zéro logique QR (US55), quiz (US56), photo (US57). De plus ce fichier est dans `screens/hunt/` (dead code, non monté). | `apps/mobile/src/screens/hunt/StepScreen.tsx` |
| 11 | **Admin services incomplets** | ❌ Confirmé au scan | Pas de services users, badges, partners dans `apps/admin/src/services/`. Pages correspondantes probablement vides. | `apps/admin/src/services/` |
| 12 | **No `zones` dans CLAUDE_CONTEXT** | ⚠️ Documentation | Module zones implémenté côté API mais absent des règles CLAUDE_CONTEXT. | `packages/api/src/modules/zones/` |
