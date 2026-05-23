# Lootopia V3 — Suivi des User Stories
Dernière mise à jour : 2026-05-23

## Légende
| Icône | Signification |
|---|---|
| ✅ | Terminée — fonctionnelle et connectée au backend |
| ⚠️ | Partielle — UI présente mais logique incomplète |
| 🔌 | UI seule — pas encore connectée à l'API réelle |
| ❌ | Absente — rien d'implémenté |
| 🚫 | Bloquée — dépend d'autre chose |

---

## Backoffice partenaires

| US | Titre | Statut | Ce qui manque / problème | Priorité |
|---|---|---|---|---|
| US01 | Connexion partenaire | ✅ | — | — |
| US03 | Inscription partenaire (flux invitation) | ✅ | Flux par invitation implémenté (2026-05-23). Table `invitations` en base. `POST /admin/invitations` (admin) → envoie lien 72h → partenaire ouvre `/register?token=xxx` (backoffice) → `POST /auth/register/partner` crée le compte avec rôle `PARTNER`. `GET /admin/invitations` liste toutes les invitations avec statut. `RegisterDto` nettoyé (plus de `role` libre). Emails loggués en console en dev. Interface admin `InvitationsPage` avec formulaire d'envoi + tableau de suivi. | — |
| US16 | Dashboard partenaire | ✅ | KPIs + graphique Recharts. Appels `GET /hunts` + `GET /hunts/:id/stats` branchés. | — |
| US17 | Créer une chasse | ✅ | `HuntCreatePage` + `HuntForm` complets. `POST /hunts` connecté. | — |
| US18 | Modifier une chasse | ✅ | `HuntEditPage` + `GET /hunts/:id` + `PATCH /hunts/:id` connectés. | — |
| US19 | Supprimer une chasse | ✅ | `HuntsPage` + `DELETE /hunts/:id` + dialog confirmation. | — |
| US20 | Templates de chasse | ✅ | `GET /hunts/templates` + `POST /hunts/from-template/:id` connectés. | — |
| US21 | Ajouter un plan ou une image | ✅ | Upload via `POST /files/upload` (multer local). `HuntForm` champ `plan_url`. Stockage local `/uploads` au lieu de MinIO (déviation technique, fonctionnel). | — |
| US22 | Définir des zones sur le plan | ⚠️ | `ZoneForm` + CRUD `/hunts/:id/zones` fonctionnels pour `rect` et `circle`. Éditeur polygone absent : message hardcodé "Éditeur polygone disponible US44" (US44 n'existe pas dans le backlog). Pas de visualisation des zones sur le plan image. | 🟠 Moyenne |
| US23 | Gérer les étapes d'une chasse | ⚠️ | CRUD complet (`StepsPage` + `StepForm` + endpoints). Mais `StepEditor.tsx` = stub `TODO`. Formulaire textuel fonctionnel, éditeur visuel absent. | 🟠 Moyenne |
| US24 | Configurer les éléments RA d'une étape | ⚠️ | `StepForm` upload image AR → `ar_content: { type: '2d-overlay', image: url }`. Pas de vrai configurateur RA (positionnement 3D, preview). `StepEditor.tsx` stub. | 🟠 Moyenne |
| US25 | Statistiques de base d'une chasse | ✅ | `StatsPage` : `participant_count`, `completed_count`, `completion_rate`, `average_points`. `GET /hunts/:id/stats` connecté. | — |
| US26 | Liste des participants | ✅ | Tableau expandable dans `StatsPage`. `GET /hunts/:id/participants` chargé au clic. Champs : email, étapes, points, dates. | — |

---

## Admin

| US | Titre | Statut | Ce qui manque / problème | Priorité |
|---|---|---|---|---|
| US02 | Connexion administrateur | ✅ | `LoginPage` admin présente. Rôle `ADMIN` vérifié par guards backend. | — |
| US27 | Dashboard global admin | ⚠️ | `DashboardPage` admin présente. Mais aucun `stats.service` dans `apps/admin/src/services/`. Très probablement données mockées ou affichage vide — à vérifier. | 🟠 Moyenne |
| US28 | Métriques globales (joueurs/chasses) | ⚠️ | Backend `GET /admin/stats` existe (retourne `user_count`, `hunt_count`, `participant_count`, `completed_count`, `completion_rate`). Pas de service dédié côté admin frontend. | 🟠 Moyenne |
| US29 | Taux de participation/complétion | ⚠️ | Calculés côté backend (`/admin/stats`). Non branchés côté admin frontend (pas de service). | 🟠 Moyenne |

---

## Mobile

| US | Titre | Statut | Ce qui manque / problème | Priorité |
|---|---|---|---|---|
| US04 | Accès invité (guest login) | ✅ | `guest-login.dto` + `ConvertAccountScreen` + `GpsConsentModal`. | — |
| US05 | Gestion des rôles et autorisations | ✅ | `RolesGuard`, `AuthRolesGuard`, `role.enum.ts`. | — |
| US06 | Voir les chasses sur une carte | ✅ | `MapScreen` + `HuntMarker` + `useLocation` + `GpsConsentModal`. | — |
| US07 | Rechercher une chasse | ⚠️ | `HuntsListScreen` présent. Filtres à vérifier (fonctionnel ou mock). | 🟡 Basse |
| US08 | Consulter le détail d'une chasse | ✅ | `HuntDetailScreen` (`screens/hunts/`) actif. Doublon `screens/hunt/` supprimé. | — |
| US09 | Rejoindre une chasse | ✅ | `POST /hunts/:id/join` + `progress.service`. | — |
| US10 | Voir la progression sur la carte | ⚠️ | `MapScreen` présent. Intégration progression à vérifier. | 🟡 Basse |
| US11 | Valider une étape par proximité GPS | ✅ | `StepValidationScreen` + `validate-step.dto` + `geo.service` PostGIS. | — |
| US12 | Scanner une étape en RA simple | ⚠️ | `ARScreen` présent. Intégration react-viro à vérifier (potentiel stub). | 🟠 Moyenne |
| US13 | Voir mes points et badges | ✅ | `ProfileScreen` + `BadgesScreen`. | — |
| US14 | Sauvegarder ma progression | ✅ | Module `progress` complet en base. | — |
| US15 | Multilangue FR/EN | ❌ | Aucune lib i18n dans aucun `package.json`. Interface fr hardcodée partout. | 🟡 Basse |
| US47 | Connexion et inscription mobile | ✅ | `LoginScreen` + `RegisterScreen` + `auth.service`. | — |
| US48 | Mode invité | ✅ | `POST /auth/guest` + `ConvertAccountScreen`. | — |
| US49 | Conversion compte invité → réel | ✅ | `ConvertAccountScreen` + `PATCH /auth/convert`. | — |
| US50 | Carte interactive avec position | ✅ | `MapScreen` + `useLocation` + `GpsConsentModal`. | — |
| US51 | Affichage des chasses sur la carte | ✅ | `MapScreen` + `HuntMarker` + `HuntBottomSheet`. | — |
| US52 | Vue liste des chasses avec filtres | ✅ | `HuntsListScreen`. | — |
| US53 | Rejoindre une chasse + voir étapes | ✅ | `HuntDetailScreen` + `progress.service`. | — |
| US54 | Validation d'étape par GPS | ✅ | `StepValidationScreen` + `POST validate`. | — |
| US55 | Validation d'étape par QR Code | ❌ | `StepScreen.tsx` = stub `return null`. `expo-camera` présent mais non utilisé. | 🔴 Haute |
| US56 | Validation d'étape par Quiz | ❌ | Aucun composant quiz. `StepScreen.tsx` = stub vide. | 🔴 Haute |
| US57 | Validation d'étape par photo | ❌ | `StepScreen.tsx` = stub `return null`. `expo-camera` présent mais non utilisé. | 🔴 Haute |
| US58 | Récapitulatif fin de chasse | ✅ | `HuntCompletionScreen`. | — |
| US59 | Page de profil joueur | ✅ | `ProfileScreen` + `GET /me/profile`. | — |
| US60 | Collection badges + historique | ✅ | `BadgesScreen` — PR #49 mergé. | — |
| US61 | Modification profil + consentement GPS | ✅ | `SettingsScreen` — PR #50 mergé. | — |
| US62 | Sécurité du compte et suppression | ✅ | `SecurityScreen` — PR #51 mergé. | — |

---

## Backend (API)

| US | Titre | Statut | Ce qui manque / problème | Priorité |
|---|---|---|---|---|
| US30 | API d'authentification | ✅ | `POST /auth/login`, `/register`, `/guest`, `PATCH /auth/convert`. | — |
| US31 | API des chasses | ✅ | CRUD complet + templates + `GET /hunts` (filtres q, lat/lng/radius). | — |
| US32 | API des étapes | ✅ | CRUD complet nested sous `/hunts/:huntId/steps`. | — |
| US33 | Gestion progression joueur | ✅ | Module `progress` complet. | — |
| US34 | Validation géographique | ✅ | `geo.service` avec `ST_DWithin` PostGIS. | — |
| US35 | Badges et points | ✅ | Module `badges`. Attribution auto à validation étape/fin chasse. | — |
| US36 | Upload de fichiers | ✅ | `multer ^1.4.5-lts.1` ajouté. `POST /files/upload`. Stockage local `/uploads`. | — |
| US37 | Exposer les statistiques | ✅ | `GET /stats/hunts` (par partenaire), `GET /admin/stats` (global). | — |
| US38 | Schéma de base de données | ✅ | Entités TypeORM + PostGIS + `init.sql`. | — |
| US39 | Sécuriser les endpoints | ✅ | Guards + Throttler (60 req/min/IP) + CORS + `ValidationPipe`. | — |
| US40 | Conformité RGPD minimale | ✅ | Module `rgpd` + `consent_gps` + suppression cascade. | — |

---

## À faire — Backoffice (ordonné par priorité)

### 🔴 Bloquant
- [ ] **US03** — Ajouter formulaire d'inscription partenaire dans `LoginPage.tsx` (ou page dédiée). Appel `POST /auth/register` avec `{ email, password, role: 'partner' }`. Backend prêt.

### 🟠 Important
- [ ] **US22** — Compléter l'éditeur de zones : ajouter le support polygone dans `ZoneForm.tsx`. Ajouter un éditeur visuel superposé au plan (`plan_url`) pour dessiner les zones en pixels. Référence "US44" dans le code = morte, à supprimer.
- [ ] **US23** — Implémenter `StepEditor.tsx` (actuellement stub `TODO`). Permet édition inline visuelle des étapes sur le plan.
- [ ] **US24** — Enrichir la configuration RA dans `StepForm.tsx` : champs position 3D, taille, type overlay. Pour l'instant seule une image 2D est supportée.

### 🟡 Nice-to-have
- [ ] Vérifier et brancher le dashboard admin (`apps/admin`) sur `GET /admin/stats` (US27/US28/US29).
- [ ] Supprimer les stubs `StatsViewer.tsx` et `StepEditor.tsx` ou les implémenter.

---

## À faire — Mobile (ordonné par priorité)

### 🔴 Bloquant
- [ ] **US55** — Implémenter QR Code dans `StepScreen.tsx` : utiliser `expo-camera` pour scanner + appel `POST /hunts/:id/steps/:stepId/validate`.
- [ ] **US56** — Implémenter Quiz dans `StepScreen.tsx` : UI questions/réponses + validation côté API (endpoint à créer ou adapter).
- [ ] **US57** — Implémenter validation photo dans `StepScreen.tsx` : utiliser `expo-camera` + upload + validation.

### 🟡 Nice-to-have
- [ ] **US15** — Multilangue : ajouter `i18next` ou `expo-localization`. Aucune lib i18n présente.
- [ ] **US12** — Vérifier `ARScreen.tsx` : intégration react-viro réelle ou stub.

---

## Anomalies techniques détectées

| # | Composant | Problème | Sévérité |
|---|---|---|---|
| A1 | `GET /hunts` (backoffice) | Endpoint `JwtOptionalAuthGuard` retourne **toutes** les chasses actives, pas uniquement celles du partenaire connecté. `HuntsPage` et `DashboardPage` affichent potentiellement les chasses d'autres partenaires. Vérifier si le backend filtre par `partner_id` quand un PARTNER token est fourni. | 🔴 Critique |
| A2 | `auth.service.ts` backoffice | Decode JWT extrait `sub`, `role`, `iat`, `exp`. L'email est inclus dans le retour `user.email` mais backend retourne seulement `{ access_token }`. Si email absent du JWT payload → champ `undefined` silencieux dans le store. | 🟠 Moyen |
| A3 | `ZoneForm.tsx` | Référence morte "Éditeur polygone disponible US44" — US44 n'existe pas dans le backlog officiel. Message trompeur à supprimer. | 🟡 Faible |
| A4 | `StepEditor.tsx` | Composant stub `TODO` déclaré dans `HuntManager` mais jamais rendu. Dead code structurel. | 🟡 Faible |
| A5 | `StatsViewer.tsx` | Composant stub `TODO` déclaré mais non utilisé dans aucune page. Dead code. | 🟡 Faible |
| A6 | `DashboardPage.tsx` | `retry: false` sur `getHuntStats()` car les brouillons retournent 404. Contournement fragile : si l'API change son comportement, les KPI seront silencieusement faux. Préférer filtrer les chasses `is_active: true` avant d'appeler les stats. | 🟡 Faible |
| A7 | `DELETE /me` (SettingsPage) | La suppression de compte partenaire déclenche un CASCADE sur **toutes ses chasses**, étapes, zones, progressions joueurs. Comportement RGPD correct mais destructeur — aucun avertissement visible dans l'UI sur la portée de la suppression (joueurs affectés). | 🟠 Moyen |
| A8 | Admin `apps/admin/src/services/` | Pas de `stats.service`, `users.service`, `badges.service`. Pages `UsersPage`, `BadgesPage`, `PartnersPage` probablement vides ou mockées. Aucun test configuré dans `apps/admin/`. | 🟠 Moyen |
| A9 | `StepScreen.tsx` (mobile) | Fichier dans `screens/hunt/` — répertoire `hunt/` est du dead code (doublons supprimés). `StepScreen.tsx` est non monté dans la navigation. Les US55/56/57 doivent être implémentées dans `screens/hunts/`. | 🔴 Critique |
