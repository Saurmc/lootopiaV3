# Lootopia API — Endpoints

> Liste exhaustive des endpoints **réellement présents dans le code** de
> `packages/api/src`. Les endpoints mentionnés dans le backlog mais non
> implémentés ne sont pas listés ici.
>
> Conventions :
> - **Auth** : colonne `Rôles` indique les rôles acceptés par `@Auth(...)`.
>   `—` signifie pas de guard d'auth. `Optional` signifie `JwtOptionalAuthGuard`
>   (mode invité accepté).
> - **JWT** : header `Authorization: Bearer <token>`.
> - Toutes les erreurs sont renvoyées au format `HttpExceptionFilter` :
>   `{ statusCode, message, timestamp, path }`.

## Sommaire
- [App / Healthcheck](#app--healthcheck)
- [Auth](#auth)
- [Hunts](#hunts)
- [Steps (nested)](#steps-nested)
- [Zones (nested)](#zones-nested)
- [Files](#files)
- [Profile (`/me`)](#profile-me)
- [RGPD (`/me`)](#rgpd-me)
- [Admin](#admin)
- [Stats](#stats)

---

## App / Healthcheck

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 1 | `GET` | `/` | — | Healthcheck. Retourne la chaîne retournée par `AppService.getHealth()`. |

---

## Auth

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 2 | `POST` | `/auth/register` | — | Inscription joueur (rôle `PLAYER` fixe). |
| 3 | `POST` | `/auth/register/partner` | — | Finalise l'inscription partenaire via token d'invitation (US03). |
| 4 | `POST` | `/auth/login` | — | Connexion. |
| 5 | `POST` | `/auth/guest` | — | Connexion/création compte invité (idempotent par `device_token`). |
| 6 | `PATCH` | `/auth/convert` | Authentifié | Convertit un compte invité en compte complet. |

### `POST /auth/register`
**Body** (`RegisterDto`)
```json
{
  "email": "player@example.com",
  "password": "MinEight1"
}
```
- `email` : `@IsEmail()`
- `password` : `@IsString() @MinLength(8)`
- Le rôle est **toujours `PLAYER`** — l'inscription partenaire passe par le flux invitation.

**Réponse 201** : `{ "access_token": "<jwt>" }`
Erreurs : `400` validation, `409` si email déjà utilisé.

### `POST /auth/register/partner`
Finalise l'inscription d'un partenaire après réception du lien d'invitation par email.

**Body** (`RegisterPartnerDto`)
```json
{
  "token": "<invitation_token_64_chars_hex>",
  "password": "MinEight1",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```
**Réponse 201** : `{ "access_token": "<jwt>" }` (JWT avec rôle `PARTNER`)
Erreurs :
- `404` token inconnu
- `409` token déjà utilisé
- `400` token expiré (TTL 72h)
- `409` email déjà associé à un compte

### `POST /auth/login`
**Body** (`LoginDto`)
```json
{ "email": "partner@example.com", "password": "MinEight1" }
```
**Réponse 200** : `{ "access_token": "<jwt>" }`
Erreurs : `401 Invalid credentials`.

---

## Hunts

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 4 | `GET` | `/hunts` | Optional | Liste des chasses actives. `?q=`, `?lat=&lng=&radius=`. |
| 5 | `GET` | `/hunts/:id` | Optional | Détail d'une chasse (`HuntDetailDto` avec étapes). |
| 6 | `POST` | `/hunts` | PARTNER, ADMIN | Créer une chasse. |
| 7 | `PATCH` | `/hunts/:id` | PARTNER, ADMIN | Modifier (ownership check). |
| 8 | `DELETE` | `/hunts/:id` | PARTNER, ADMIN | Supprimer (ownership check). `204`. |
| 9 | `GET` | `/hunts/templates` | PARTNER, ADMIN | Liste des templates prédéfinis. |
| 10 | `POST` | `/hunts/from-template/:templateId` | PARTNER, ADMIN | Créer une chasse depuis un template. |
| 11 | `GET` | `/hunts/:id/stats` | PARTNER, ADMIN | Statistiques d'une chasse (ownership check). |
| 12 | `GET` | `/hunts/:id/participants` | PARTNER, ADMIN | Liste des participants (ownership check). |
| 13 | `GET` | `/hunts/:id/progress` | Authentifié | Progression du joueur connecté pour cette chasse. |
| 14 | `POST` | `/hunts/:id/join` | Authentifié | Rejoindre une chasse (crée une progression). |
| 15 | `POST` | `/hunts/:id/steps/:stepId/validate` | Authentifié | Valider une étape par proximité GPS (PostGIS). |

### `GET /hunts`
**Query params** (`NearbyQueryDto`, tous optionnels) :
- `q` : string, ≤ 100 car — recherche textuelle (title/description).
- `lat` : `-90..90`
- `lng` : `-180..180`
- `radius` : `100..50000` (m) — défaut côté service `5000`.

Comportement :
1. Si `q` → `search(q)`.
2. Sinon si `lat` et `lng` → `findNearby(lat, lng, radius)` (requête PostGIS).
3. Sinon → `findAll()`.

**Réponse 200** : `HuntEntity[]` ou `NearbyHuntRow[]` (incluant `distance_meters`).

### `GET /hunts/:id`
**Réponse 200** (`HuntDetailDto`) :
```json
{
  "id": "...",
  "title": "...",
  "description": "...",
  "location": "...",
  "difficulty": "easy",
  "duration": 60,
  "points": 100,
  "is_active": true,
  "step_count": 3,
  "steps": [
    {
      "id": "...",
      "order": 0,
      "title": "...",
      "description": "...",
      "validation_radius": 50,
      "ar_content": null
    }
  ],
  "created_at": "..."
}
```
> Note RGPD/gameplay : les coordonnées des étapes ne sont **pas** exposées ici.

Erreurs : `404`.

### `POST /hunts`
**Body** (`CreateHuntDto`) :
```json
{
  "title": "Nouvelle chasse",
  "description": "Description",
  "location": "Paris",
  "lat": 48.8566,
  "lng": 2.3522,
  "difficulty": "medium",
  "duration": 90,
  "points": 200,
  "is_active": true
}
```
Règles : `title` 3..200 ; `difficulty` ∈ `easy|medium|hard` ; `lat/lng` optionnels.

**Réponse 201** : `HuntEntity` créée.
Erreurs : `400` validation, `401`/`403` auth.

### `PATCH /hunts/:id`
**Body** (`UpdateHuntDto`) : tous les champs de `CreateHuntDto` en optionnel.
**Réponse 200** : `HuntEntity` mise à jour.
Erreurs : `404` si chasse inconnue **ou** pas propriétaire.

### `DELETE /hunts/:id`
**Réponse 204**. Erreurs : `404`.

### `GET /hunts/templates`
**Réponse 200** : `HuntTemplate[]` depuis `hunt-templates.constants.ts`.
Actuellement 4 templates (`urban-explorer`, `history-trail`, `nature-challenge`, `family-fun`).

### `POST /hunts/from-template/:templateId`
**Réponse 201** : `HuntEntity` créée avec les valeurs par défaut du template,
`is_active: false`, pas de coordonnées.
Erreurs : `404` si `templateId` inconnu.

### `GET /hunts/:id/stats`
**Réponse 200** :
```json
{
  "hunt_id": "...",
  "participant_count": 12,
  "completed_count": 5,
  "completion_rate": 42,
  "average_points": 120
}
```

### `GET /hunts/:id/participants`
**Réponse 200** : liste ordre `started_at DESC`.
```json
[
  {
    "user_id": "...",
    "email": "player@example.com",
    "current_step": 2,
    "completed_steps": [0, 1],
    "total_points": 80,
    "started_at": "...",
    "completed_at": null
  }
]
```

### `GET /hunts/:id/progress`
**Réponse 200** (`ProgressMapDto`) :
```json
{
  "progress_id": "...",
  "hunt_id": "...",
  "current_step": 1,
  "completed_steps": [0],
  "total_points": 50,
  "started_at": "...",
  "completed_at": null,
  "steps": [
    { "id": "...", "order": 0, "title": "...", "status": "completed",
      "validation_radius": 50, "coordinates": { "lat": 48.8, "lng": 2.3 } },
    { "id": "...", "order": 1, "title": "...", "status": "current",
      "validation_radius": 50, "coordinates": { "lat": 48.85, "lng": 2.35 } },
    { "id": "...", "order": 2, "title": "...", "status": "locked",
      "validation_radius": 50, "coordinates": null }
  ]
}
```
> `coordinates` n'est exposé que si `user.consent_gps === true` **et** l'étape
> est `completed` ou `current`. `locked` → `null`.

Erreurs : `404` si pas de progression, `404` si chasse inconnue.

### `POST /hunts/:id/join`
**Réponse 201** : `ProgressEntity` créée avec `current_step=0`, `completed_steps=[]`.
Erreurs : `404` si chasse inactive/inconnue, `409` si déjà rejoint.

### `POST /hunts/:id/steps/:stepId/validate`
**Body** (`ValidateStepDto`) :
```json
{ "lat": 48.8566, "lng": 2.3522 }
```
**Réponse 200** : `ProgressEntity` mise à jour (avec `total_points` incrémenté,
`current_step` suivante, `completed_at` rempli si la chasse est terminée).
Erreurs :
- `404 No progress found for this hunt`
- `404 Step {id} not found in this hunt`
- `409 Step already validated`
- `400 This is not the current step`
- `400 Step has no location configured`
- `400 Player is not within validation radius`

---

## Steps (nested)

Toutes les routes sont préfixées par `/hunts/:huntId/steps`.

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 16 | `GET` | `/hunts/:huntId/steps` | Optional | Liste des étapes d'une chasse. |
| 17 | `POST` | `/hunts/:huntId/steps` | PARTNER, ADMIN | Créer une étape (ownership check). |
| 18 | `PATCH` | `/hunts/:huntId/steps/:stepId` | PARTNER, ADMIN | Modifier une étape. |
| 19 | `DELETE` | `/hunts/:huntId/steps/:stepId` | PARTNER, ADMIN | Supprimer une étape. `204`. |

### `POST /hunts/:huntId/steps`
**Body** (`CreateStepDto`)
```json
{
  "order": 0,
  "title": "Devant la fontaine",
  "description": "Rendez-vous à la fontaine centrale",
  "lat": 48.8566,
  "lng": 2.3522,
  "validation_radius": 50,
  "ar_content": { "type": "2d-overlay", "image": "/uploads/xxx.png" }
}
```
Règles : `order` int ≥ 0, `title` 2..200, `validation_radius` 10..10 000.
Coordonnées converties en GeoJSON `{ type: 'Point', coordinates: [lng, lat] }`
et insérées sur colonne `geography(Point, 4326)`.

### `PATCH /hunts/:huntId/steps/:stepId`
**Body** : tous champs optionnels.
Erreurs : `404` si chasse pas propriétaire ou étape inconnue/lien cassé.

---

## Zones (nested)

Toutes les routes sont préfixées par `/hunts/:huntId/zones`.

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 20 | `GET` | `/hunts/:huntId/zones` | Optional | Liste des zones d'une chasse. |
| 21 | `POST` | `/hunts/:huntId/zones` | PARTNER, ADMIN | Créer une zone (ownership check). |
| 22 | `PATCH` | `/hunts/:huntId/zones/:zoneId` | PARTNER, ADMIN | Modifier une zone. |
| 23 | `DELETE` | `/hunts/:huntId/zones/:zoneId` | PARTNER, ADMIN | Supprimer une zone. `204`. |

### `POST /hunts/:huntId/zones`
**Body** (`CreateZoneDto`)
```json
{
  "label": "Entrée",
  "shape": {
    "type": "rect",
    "x": 10,
    "y": 20,
    "width": 100,
    "height": 80
  },
  "order": 0
}
```
- `label` : string optionnel
- `shape` : `jsonb` — `ZoneShape` supporte `rect | circle | polygon` en
  coordonnées pixel sur un plan uploadé.
- `order` : int ≥ 0, défaut 0.

Erreurs : `404` chasse inconnue, `403` pas propriétaire.

---

## Files

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 24 | `POST` | `/files/upload` | PARTNER, ADMIN | Upload d'un fichier (image ou PDF). |

### `POST /files/upload`
- **Content-Type** : `multipart/form-data`
- **Form field** : `file`
- **Types acceptés** : `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`
- **Taille max** : 10 Mo
- Stockage : disque local sous `./uploads`, nom `<uuid>.<ext>`.

**Réponse 201** :
```json
{
  "url": "/uploads/8a1e3f6c-....png",
  "filename": "8a1e3f6c-....png",
  "originalname": "plan.png",
  "mimetype": "image/png",
  "size": 123456
}
```
Les fichiers sont servis en statique : `GET /uploads/<filename>`.
Erreurs : `400` si type non autorisé, taille dépassée, ou pas de fichier fourni.

---

## Profile (`/me`)

Tous ces endpoints sont sous `@Controller('me') @Auth()` → JWT obligatoire,
tous rôles acceptés.

| # | Méthode | URL | Description |
|---|---|---|---|
| 25 | `GET` | `/me/stats` | KPI du joueur connecté. |
| 26 | `GET` | `/me/progress` | Chasses en cours (`completed_at === null`). |
| 27 | `GET` | `/me/hunts` | Historique complet des chasses (toutes progressions). |
| 28 | `GET` | `/me/badges` | Liste des badges obtenus. |

### `GET /me/stats`
```json
{
  "total_points": 520,
  "hunt_count": 4,
  "completed_hunts": 2,
  "badge_count": 2
}
```

### `GET /me/progress`
```json
[
  {
    "progress_id": "...",
    "hunt_id": "...",
    "current_step": 2,
    "completed_steps": [0, 1],
    "total_points": 80,
    "started_at": "..."
  }
]
```

### `GET /me/hunts`
Liste complète (terminées et en cours).

### `GET /me/badges`
```json
[
  { "id": "...", "user_id": "...", "badge_type": "hunt_completed", "earned_at": "..." },
  { "id": "...", "user_id": "...", "badge_type": "first_hunt", "earned_at": "..." }
]
```

---

## RGPD (`/me`)

`@Controller('me') @Auth()`. Coexiste avec `ProfileController` sur le même préfixe.

| # | Méthode | URL | Description |
|---|---|---|---|
| 29 | `GET` | `/me/consent` | Lire le consentement GPS courant. |
| 30 | `PATCH` | `/me/consent` | Mettre à jour le consentement GPS. |
| 31 | `DELETE` | `/me` | Suppression du compte (CASCADE hunts/progress/badges). `204`. |

### `PATCH /me/consent`
**Body** (`UpdateConsentDto`)
```json
{ "consent_gps": true }
```
**Réponse 200** : `{ "message": "Consent updated" }`

---

## Admin

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 32 | `GET` | `/admin/stats` | ADMIN | KPI globaux de la plateforme. |
| 33 | `POST` | `/admin/invitations` | ADMIN | Envoie une invitation partenaire (token 72h). |
| 34 | `GET` | `/admin/invitations` | ADMIN | Liste toutes les invitations avec leur statut. |

### `GET /admin/stats`
```json
{
  "user_count": 120,
  "hunt_count": 45,
  "participant_count": 300,
  "completed_count": 125,
  "completion_rate": 42
}
```

### `POST /admin/invitations`
**Body** (`CreateInvitationDto`)
```json
{
  "email": "musee@example.fr",
  "partnerName": "Musée du Louvre"
}
```
- `email` : `@IsEmail()` — adresse du futur partenaire
- `partnerName` : `@IsString() @MaxLength(100) @IsOptional()`

**Réponse 201** : `{ "id": "...", "email": "...", "expiresAt": "<iso8601>" }`

En développement, le lien d'activation est **loggué dans la console** du backend au format :
```
[INVITATION] Destinataire: musee@example.fr
Lien d'activation (valable 72h) : http://localhost:5173/register?token=<hex64>
```

Erreurs : `409` si une invitation active (non expirée, non utilisée) existe déjà pour cet email.

### `GET /admin/invitations`
**Réponse 200** : `InvitationEntity[]` triée `created_at DESC`.
```json
[
  {
    "id": "...",
    "email": "musee@example.fr",
    "partner_name": "Musée du Louvre",
    "expires_at": "...",
    "used_at": null,
    "created_by_id": "...",
    "created_at": "..."
  }
]
```
Calcul du statut côté client : `used_at !== null` → **utilisée** ; `expires_at < now` → **expirée** ; sinon → **en attente**.

---

## Stats

| # | Méthode | URL | Rôles | Description |
|---|---|---|---|---|
| 35 | `GET` | `/stats/hunts` | PARTNER, ADMIN | KPI par chasse. PARTNER → ses chasses, ADMIN → toutes. |

### `GET /stats/hunts`
```json
[
  {
    "hunt_id": "...",
    "title": "Chasse urbaine",
    "is_active": true,
    "participant_count": 20,
    "completed_count": 8,
    "completion_rate": 40,
    "average_points": 90
  }
]
```

---

## Résumé des codes HTTP courants

| Code | Contexte |
|---|---|
| `200` | GET / PATCH / login / validate |
| `201` | POST de création (`@HttpCode(HttpStatus.CREATED)`) |
| `204` | DELETE |
| `400` | Validation DTO (ValidationPipe) ou règle métier |
| `401` | JWT absent/invalide |
| `403` | `RolesGuard` : rôle insuffisant, ou `ZonesService` ownership |
| `404` | Ressource inconnue ou ownership mismatch (hunts/steps) |
| `409` | Conflit : email déjà utilisé, chasse déjà rejointe, étape déjà validée |
| `500` | Erreur non gérée — `Internal server error` via filter |

## Endpoints absents du code (mentionnés ailleurs mais NON implémentés)

- Aucune route sous `/users` (controller vide).
- Aucune route sous `/progress` (controller vide — la logique est sous `/hunts`).
- Aucune route sous `/badges` (attribution automatique, lecture sous `/me/badges`).
- Pas de `POST /auth/logout` ni `POST /auth/refresh`.
- Pas de `image_url` sur `/hunts` (US21 non mergée dans la branche actuelle).
