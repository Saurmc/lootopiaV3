# Lootopia V3 — Suivi des User Stories

Dernière mise à jour : 2026-06-03 (US63 ✅, US23/US24 ⚠️→⚠️, fix CORS)

## Légende

| Icône | Signification                                    |
| ----- | ------------------------------------------------ |
| ✅    | Terminée — fonctionnelle et connectée au backend |
| ⚠️    | Partielle — UI présente mais logique incomplète  |
| 🔌    | UI seule — pas encore connectée à l'API réelle   |
| ❌    | Absente — rien d'implémenté                      |
| 🚫    | Bloquée — dépend d'autre chose                   |

> **Branches en attente de merge** :
>
> - `feature/US03-invitation-partenaire` — flux invitation partenaire complet (invitations module, mail, InvitationsPage admin, RegisterPage backoffice)
> - `feature/US22-zone-visual-editor` — éditeur SVG ZoneCanvas + tests

---

## Backoffice partenaires

| US   | Titre                                    | Statut | Ce qui manque / problème                                                                                                                                                                                                                                                          | Priorité   |
| ---- | ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| US01 | Connexion partenaire                     | ✅     | —                                                                                                                                                                                                                                                                                 | —          |
| US03 | Inscription partenaire (flux invitation) | ✅     | Flux invitation non mergé sur `develop`. Module `invitations` absent du backend. Pas de `POST /admin/invitations`, pas de `POST /auth/register/partner`, pas de `RegisterPage.tsx` backoffice, pas d'`InvitationsPage` admin. Implémenté sur `feature/US03-invitation-partenaire` |
| US16 | Dashboard partenaire                     | ✅     | KPIs + graphique Recharts. `GET /hunts` + `GET /hunts/:id/stats` branchés.                                                                                                                                                                                                        | —          |
| US17 | Créer une chasse                         | ✅     | `HuntCreatePage` + `HuntForm` complets. `POST /hunts` connecté.                                                                                                                                                                                                                   | —          |
| US18 | Modifier une chasse                      | ✅     | `HuntEditPage` + `GET /hunts/:id` + `PATCH /hunts/:id` connectés.                                                                                                                                                                                                                 | —          |
| US19 | Supprimer une chasse                     | ✅     | `HuntsPage` + `DELETE /hunts/:id` + dialog confirmation.                                                                                                                                                                                                                          | —          |
| US20 | Templates de chasse                      | ✅     | `GET /hunts/templates` + `POST /hunts/from-template/:id` connectés.                                                                                                                                                                                                               | —          |
| US21 | Ajouter un plan ou une image             | ✅     | Upload via `POST /files/upload` (multer local). `HuntForm` champ `plan_url`. Stockage local `/uploads` au lieu de MinIO (déviation technique, fonctionnel).                                                                                                                       | —          |
| US22 | Définir des zones sur le plan            | ⚠️     | `ZoneCanvas.tsx` absent sur `develop` (sur `feature/US22-zone-visual-editor`). Référence morte "US44" toujours présente dans `ZoneForm.tsx`. Formulaire textuel fonctionnel pour `rect` et `circle` uniquement.                                                                   | 🟠 Moyenne |
| US23 | Gérer les étapes d'une chasse            | ⚠️     | CRUD complet (`StepsPage` + `StepForm` + endpoints). `StepEditor.tsx` = stub `TODO`. `StepForm` expose maintenant `validation_type` (gps/ar/qrcode/quiz/photo). Champs dynamiques qrcode/quiz/photo non configurables (réponse attendue, code QR).                                | 🟠 Moyenne |
| US24 | Configurer les éléments RA d'une étape   | ⚠️     | `StepForm` expose sélecteur `validation_type=ar` + mode AR (`2d-overlay` ou `ar-3d-spatial`). `ar-3d-spatial` : upload image marqueur + URL modèle 3D optionnel. URL absolue stockée en base. Pas de preview 3D ni positionnement spatial dans le BO.                             | 🟠 Moyenne |
| US25 | Statistiques de base d'une chasse        | ✅     | `StatsPage` : `participant_count`, `completed_count`, `completion_rate`, `average_points`. `GET /hunts/:id/stats` connecté.                                                                                                                                                       | —          |
| US26 | Liste des participants                   | ✅     | Tableau expandable dans `StatsPage`. `GET /hunts/:id/participants` chargé au clic. Champs : email, étapes, points, dates.                                                                                                                                                         | —          |

---

## Admin

| US   | Titre                                | Statut | Ce qui manque / problème                                                                                                                                                                                                        | Priorité    |
| ---- | ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| US02 | Connexion administrateur             | ⚠️     | Backend : guard `ADMIN` présent et fonctionnel. Frontend admin : `App.tsx` = `<div>Lootopia Admin TODO</div>`, `LoginPage` = `return null`, `router/index.tsx` = tableau vide. Application admin entièrement non fonctionnelle. | 🔴 Critique |
| US27 | Dashboard global admin               | ❌     | `DashboardPage` admin = `return null`. Aucune donnée affichée.                                                                                                                                                                  | 🔴 Critique |
| US28 | Métriques globales (joueurs/chasses) | ❌     | Backend `GET /admin/stats` existe et retourne les métriques. Aucun frontend admin connecté.                                                                                                                                     | 🟠 Moyenne  |
| US29 | Taux de participation/complétion     | ❌     | Calculés côté backend (`/admin/stats`). Aucun frontend admin connecté.                                                                                                                                                          | 🟠 Moyenne  |

---

## Mobile

| US   | Titre                                  | Statut | Ce qui manque / problème                                                                                                                                                                                                                                                                                                     | Priorité   |
| ---- | -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| US04 | Accès invité (guest login)             | ✅     | `guest-login.dto` + `ConvertAccountScreen` + `GpsConsentModal`.                                                                                                                                                                                                                                                              | —          |
| US05 | Gestion des rôles et autorisations     | ✅     | `RolesGuard`, `AuthRolesGuard`, `role.enum.ts`.                                                                                                                                                                                                                                                                              | —          |
| US06 | Voir les chasses sur une carte         | ✅     | `MapScreen` + `HuntMarker` + `useLocation` + `GpsConsentModal`.                                                                                                                                                                                                                                                              | —          |
| US07 | Rechercher une chasse                  | ✅     | `HuntsListScreen` : barre de recherche (debounce → `GET /hunts?q=`), filtres difficulté (facile/moyen/difficile), tri par distance.                                                                                                                                                                                          | —          |
| US08 | Consulter le détail d'une chasse       | ✅     | `HuntDetailScreen` (`screens/hunts/`) actif. Doublon `screens/hunt/HuntDetailScreen` = stub non monté.                                                                                                                                                                                                                       | —          |
| US09 | Rejoindre une chasse                   | ✅     | `POST /hunts/:id/join` + `progress.service`.                                                                                                                                                                                                                                                                                 | —          |
| US10 | Voir la progression sur la carte       | ⚠️     | `MapScreen` distingue les chasses complétées (marqueurs grisés) des actives. Mais la progression étape par étape (étape courante sur la carte) n'est pas implémentée.                                                                                                                                                        | 🟡 Basse   |
| US11 | Valider une étape par proximité GPS    | ✅     | `StepValidationScreen` (`type: gps`) + `validate-step.dto` + `geo.service` PostGIS.                                                                                                                                                                                                                                          | —          |
| US12 | Scanner une étape en RA simple         | ✅     | `ARSection` + `StepValidationScreen` : type `2d-overlay` (overlay immédiat) et `qr-overlay` (scan QR physique → overlay révélé). `validateAr` côté API vérifie `qr_trigger`. 4 tests API. Branch `feature/US12-ar-qr-overlay`.                                                                                              | —          |
| US13 | Voir mes points et badges              | ✅     | `ProfileScreen` + `BadgesScreen`.                                                                                                                                                                                                                                                                                            | —          |
| US14 | Sauvegarder ma progression             | ✅     | Module `progress` complet en base.                                                                                                                                                                                                                                                                                           | —          |
| US15 | Multilangue FR/EN                      | ❌     | Aucune lib i18n dans aucun `package.json`. Interface fr hardcodée partout.                                                                                                                                                                                                                                                   | 🟡 Basse   |
| US47 | Connexion et inscription mobile        | ✅     | `LoginScreen` + `RegisterScreen` + `auth.service`.                                                                                                                                                                                                                                                                           | —          |
| US48 | Mode invité                            | ✅     | `POST /auth/guest` + `ConvertAccountScreen`.                                                                                                                                                                                                                                                                                 | —          |
| US49 | Conversion compte invité → réel        | ✅     | `ConvertAccountScreen` + `PATCH /auth/convert`.                                                                                                                                                                                                                                                                              | —          |
| US50 | Carte interactive avec position        | ✅     | `MapScreen` + `useLocation` + `GpsConsentModal`.                                                                                                                                                                                                                                                                             | —          |
| US51 | Affichage des chasses sur la carte     | ✅     | `MapScreen` + marqueurs difficulté + marqueurs complétés distincts + `HuntBottomSheet`.                                                                                                                                                                                                                                      | —          |
| US52 | Vue liste des chasses avec filtres     | ✅     | `HuntsListScreen` : search, filtres difficulté, tri distance.                                                                                                                                                                                                                                                                | —          |
| US53 | Rejoindre une chasse + voir étapes     | ✅     | `HuntDetailScreen` + `progress.service`.                                                                                                                                                                                                                                                                                     | —          |
| US54 | Validation d'étape par GPS             | ✅     | `StepValidationScreen` (`validationType='gps'`) + `POST validate`.                                                                                                                                                                                                                                                           | —          |
| US55 | Validation d'étape par QR Code         | ⚠️     | `StepValidationScreen` (`validationType='qrcode'`) : scanner `CameraView` fonctionnel, envoie `{ qr_code }`. `StepForm` expose `validation_type=qrcode` mais pas le champ `qr_trigger` — non configurable depuis le BO sans SQL.                                           | 🟠 Moyenne |
| US56 | Validation d'étape par Quiz            | ⚠️     | `StepValidationScreen` (`validationType='quiz'`) : champ texte libre, validation insensible à la casse. QCM non supporté. `StepForm` expose `validation_type=quiz` mais pas la réponse attendue.                                                                            | 🟠 Moyenne |
| US57 | Validation d'étape par photo           | ⚠️     | `StepValidationScreen` (`validationType='photo'`) : prise de photo, envoi URI locale comme `file_url`. Backend accepte automatiquement. Photo non uploadée avant envoi. `StepForm` expose `validation_type=photo` mais sans config spécifique.                               | 🟠 Moyenne |
| US58 | Récapitulatif fin de chasse            | ✅     | `HuntCompletionScreen`.                                                                                                                                                                                                                                                                                                      | —          |
| US59 | Page de profil joueur                  | ✅     | `ProfileScreen` + `GET /me/profile`.                                                                                                                                                                                                                                                                                         | —          |
| US60 | Collection badges + historique         | ✅     | `BadgesScreen` — PR #49 mergé.                                                                                                                                                                                                                                                                                               | —          |
| US61 | Modification profil + consentement GPS | ✅     | `SettingsScreen` — PR #50 mergé.                                                                                                                                                                                                                                                                                             | —          |
| US62 | Sécurité du compte et suppression      | ✅     | `SecurityScreen` — PR #51 mergé.                                                                                                                                                                                                                                                                                             | —          |
| US63 | RA spatiale 3D (image marker)          | ✅     | `ViroARPhase.tsx` : `ViroARImageMarker` (2D) + `ViroARObjectMarker` (3D physique). Image via data-URI, modèle 3D via `file://` local. `billboard` pour orientation. `ArContent3DSpatial` type shared. `validateAr` étendu. Configurable depuis le `StepForm` BO sans SQL. GLB nécessite normales+matériaux (Blender).          | —          |

---

## Backend (API)

| US   | Titre                      | Statut | Ce qui manque / problème                                                                                    | Priorité |
| ---- | -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- | -------- |
| US30 | API d'authentification     | ✅     | `POST /auth/login`, `/register`, `/guest`, `PATCH /auth/convert`.                                           | —        |
| US31 | API des chasses            | ✅     | CRUD complet + templates + `GET /hunts` (filtres q, lat/lng/radius, filtre partner_id quand token PARTNER). | —        |
| US32 | API des étapes             | ✅     | CRUD complet nested sous `/hunts/:huntId/steps`.                                                            | —        |
| US33 | Gestion progression joueur | ✅     | Module `progress` complet.                                                                                  | —        |
| US34 | Validation géographique    | ✅     | `geo.service` avec `ST_DWithin` PostGIS.                                                                    | —        |
| US35 | Badges et points           | ✅     | Module `badges`. Attribution auto à validation étape/fin chasse.                                            | —        |
| US36 | Upload de fichiers         | ✅     | `multer ^1.4.5-lts.1`. `POST /files/upload`. Stockage local `/uploads`.                                     | —        |
| US37 | Exposer les statistiques   | ✅     | `GET /stats/hunts` (par partenaire), `GET /admin/stats` (global).                                           | —        |
| US38 | Schéma de base de données  | ✅     | Entités TypeORM + PostGIS + `init.sql`.                                                                     | —        |
| US39 | Sécuriser les endpoints    | ✅     | Guards + Throttler (60 req/min/IP) + CORS + `ValidationPipe`.                                               | —        |
| US40 | Conformité RGPD minimale   | ✅     | Module `rgpd` + `consent_gps` + suppression cascade.                                                        | —        |

---

## À faire — priorité immédiate

### 🔴 Bloquant

- [ ] **Merger `feature/US03-invitation-partenaire`** → US03 : flux invitation complet (invitations module, mail, InvitationsPage admin, RegisterPage backoffice, endpoints backend).
- [ ] **Merger `feature/US22-zone-visual-editor`** → US22 : ZoneCanvas SVG, suppression référence US44, tests.
- [ ] **US02 / US27–US29 admin** : implémenter l'application admin (`App.tsx`, router, LoginPage, DashboardPage connecté à `GET /admin/stats`).

### 🟠 Important

- [x] **US23** — `validation_type` selector ajouté dans `StepForm.tsx` (gps/ar/qrcode/quiz/photo). Reste : champs dynamiques `qr_trigger` et réponse quiz. `StepEditor.tsx` stub toujours présent.
- [x] **US24** — `StepForm` expose `ar-3d-spatial` : upload image marqueur + URL modèle 3D + type. Reste : preview 3D, positionnement spatial.
- [ ] **US55** — Ajouter champ `qr_trigger` dans `StepForm` quand `validation_type=qrcode`.
- [ ] **US56** — Ajouter champ réponse attendue dans `StepForm` quand `validation_type=quiz`.
- [ ] **US55/56/57** — Corriger upload photo mobile (upload vers `/files/upload` avant envoi de `file_url`).

### 🟡 Nice-to-have

- [ ] Supprimer le stub `screens/hunt/HuntDetailScreen.tsx` (dead code, jamais monté).
- [x] **US12** — `ARSection` QR-triggered + 2d-overlay implémenté. Branch `feature/US12-ar-qr-overlay`.
- [x] **US63** — RA spatiale 3D : `ViroARPhase.tsx` + `ArContent3DSpatial` + `validateAr` étendu + configurable depuis `StepForm` BO.
- [ ] **US15** — Multilangue : ajouter `i18next` ou `expo-localization`.
- [ ] Supprimer ou implémenter `StatsViewer.tsx` et `StepEditor.tsx`.

---

## Anomalies techniques

| #   | Composant                                 | Problème                                                                                                                                                                                                                                                                                              | Sévérité    |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| A1  | `GET /hunts` (backoffice)                 | ✅ **Résolu** — Endpoint filtre par `partner_id` quand token PARTNER fourni (`findAllForPartner`). Retourne toutes les chasses seulement si pas de token ou token PLAYER.                                                                                                                             | ✅ Résolu   |
| A2  | `auth.service.ts` backoffice              | Decode JWT extrait `sub`, `role`, `iat`, `exp`. L'email est inclus dans le retour `user.email` mais backend retourne seulement `{ access_token }`. Si email absent du JWT payload → champ `undefined` silencieux dans le store.                                                                       | 🟠 Moyen    |
| A3  | `ZoneForm.tsx`                            | Référence morte "Éditeur polygone disponible US44" toujours présente sur `develop`. Sera supprimée après merge `feature/US22-zone-visual-editor`.                                                                                                                                                     | 🟡 Faible   |
| A4  | `StepEditor.tsx` (backoffice)             | Composant stub `TODO` déclaré dans `HuntManager` mais jamais rendu. Dead code structurel.                                                                                                                                                                                                             | 🟡 Faible   |
| A5  | `StatsViewer.tsx` (backoffice)            | Composant stub `TODO` déclaré mais non utilisé dans aucune page. Dead code.                                                                                                                                                                                                                           | 🟡 Faible   |
| A6  | `DashboardPage.tsx` (backoffice)          | `retry: false` sur `getHuntStats()` car les brouillons retournent 404. Contournement fragile. Préférer filtrer `is_active: true` avant d'appeler les stats.                                                                                                                                           | 🟡 Faible   |
| A7  | `DELETE /me` (SettingsPage)               | Suppression de compte partenaire déclenche CASCADE sur toutes ses chasses, étapes, zones, progressions joueurs. Aucun avertissement visible dans l'UI sur la portée.                                                                                                                                  | 🟠 Moyen    |
| A8  | `apps/admin/`                             | Application admin entièrement stub : `App.tsx` = `<div>Lootopia Admin TODO</div>`, toutes les pages `return null`, `router = []`, services = `{}`. Aucun test configuré.                                                                                                                              | 🔴 Critique |
| A9  | `screens/hunt/` (mobile)                  | `screens/hunt/HuntDetailScreen.tsx` et `screens/hunt/StepScreen.tsx` sont des stubs non montés dans la navigation (dead code). Le vrai `HuntDetailScreen` actif est dans `screens/hunts/`. Les US55/56/57 sont implémentées dans `screens/hunts/StepValidationScreen.tsx`, pas dans `StepScreen.tsx`. | 🟠 Moyen    |
| A10 | `StepValidationScreen` — validation photo | La photo capturée est envoyée comme URI locale (`file_url: uri`) sans upload préalable vers `/files/upload`. Le backend accepte n'importe quelle chaîne non vide. Validation automatique sans vérification du contenu.                                                                                | 🟠 Moyen    |
