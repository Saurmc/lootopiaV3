# Cycle de vie d'une requête HTTP — Lootopia API

> Généré à partir du code réellement présent dans `packages/api/`.

NestJS applique toujours les blocs suivants, dans cet ordre, à chaque requête HTTP entrante.

```
Client HTTP
    │
    ▼
┌────────────────────────────────────────┐
│ 1. Express (NestExpressApplication)    │  main.ts : NestFactory.create<NestExpressApplication>
│    - CORS                              │  app.enableCors(...)
│    - Static /uploads                   │  app.useStaticAssets(..., { prefix: '/uploads' })
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 2. Throttler (ThrottlerModule global)  │  60 req/min/IP — app.module.ts
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 3. Guards                              │  JwtAuthGuard / JwtOptionalAuthGuard / RolesGuard
│    - @Auth() / @UseGuards(...)         │  (combinables via le décorateur Auth)
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 4. Interceptors (before)               │  FileInterceptor pour /files/upload
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 5. Pipes / DTO validation              │  ValidationPipe global (class-validator)
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 6. Controller method                   │  ex: HuntsController.findAll
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 7. Service                             │  ex: HuntsService.findAll
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 8. Repository (TypeORM) ou DataSource  │  ex: HuntsRepository / GeoService
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 9. PostgreSQL + PostGIS                │
└────────────────────────────────────────┘
    │
    ▼  Entity(ies)
┌────────────────────────────────────────┐
│ 10. Mapping Entity → DTO               │  ex: HuntsService.getDetail → HuntDetailDto
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 11. HttpExceptionFilter (si erreur)    │  {statusCode, message, timestamp, path}
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 12. Réponse HTTP JSON                  │
└────────────────────────────────────────┘
```

Les étapes 4, 5, 10 et 11 interviennent selon la route et le résultat ; les
étapes 1-3, 6-9 et 12 sont systématiques.

---

## Exemple 1 — GET public : lister les chasses à proximité

Route : `GET /hunts?lat=48.8566&lng=2.3522&radius=5000`

### 1. Express
La requête arrive. CORS accepte l'origine si elle correspond à `CORS_ORIGIN`.
Aucun fichier statique ne match.

### 2. Throttler
Compteur incrémenté, passe (moins de 60 req/min pour cette IP).

### 3. Guard
La méthode est décorée ainsi :
```ts
@UseGuards(JwtOptionalAuthGuard)
@Get()
findAll(@Query() query: NearbyQueryDto, @CurrentUser() _user: AuthenticatedUser | null) { ... }
```
`JwtOptionalAuthGuard` essaie de valider un éventuel Bearer token.
S'il n'y en a pas ou s'il est invalide, `handleRequest` retourne `null` au
lieu de jeter → la requête continue en mode invité (`_user = undefined`).

### 4. Interceptors
Aucun interceptor custom. NestJS applique ses interceptors internes.

### 5. DTO validation
`NearbyQueryDto` est validé par le `ValidationPipe` global :
- `lat` transformé en `number`, borne `-90..90`.
- `lng` transformé en `number`, borne `-180..180`.
- `radius` transformé en `number`, borne `100..50000`.

Si `lat` vaut `200`, le pipe jette `BadRequestException` → saute directement
à l'étape 11 (filter).

### 6. Controller
```ts
if (query.lat !== undefined && query.lng !== undefined) {
  return this.huntsService.findNearby(query.lat, query.lng, query.radius);
}
```

### 7. Service
`HuntsService.findNearby(lat, lng, radius)` délègue à `GeoService.findHuntsNearby`.

### 8. Repository / DataSource
`GeoService` injecte `@InjectDataSource()` et exécute une requête SQL brute
PostGIS :
```sql
SELECT h.id, h.title, ..., ST_Distance(
  h.coordinates::geography,
  ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
) AS distance_meters
FROM hunts h
WHERE h.is_active = true
  AND h.coordinates IS NOT NULL
  AND ST_DWithin(
    h.coordinates::geography,
    ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
    $3
  )
ORDER BY distance_meters ASC
```

### 9. PostgreSQL + PostGIS
Le planner utilise l'index GiST sur `coordinates` (à condition qu'il soit créé
manuellement — ce n'est pas dans le code). Retourne les lignes correspondantes.

### 10. Mapping
Aucun mapping explicite ici : `NearbyHuntRow[]` est retourné directement par
Nest qui le sérialise en JSON (via son serializer par défaut).

### 11. Filter
Aucun — pas d'erreur.

### 12. Réponse
```json
[
  {
    "id": "...",
    "title": "Chasse urbaine",
    "description": "...",
    "distance_meters": 1234.5,
    "...": "..."
  }
]
```

---

## Exemple 2 — POST protégé : créer une chasse

Route : `POST /hunts`
Auth : JWT obligatoire, rôle `PARTNER` ou `ADMIN`.
Body :
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

### 1-2. Express + Throttler
Identique à l'exemple 1.

### 3. Guards
```ts
@Auth(Role.PARTNER, Role.ADMIN)
@Post()
@HttpCode(HttpStatus.CREATED)
createHunt(@Body() dto: CreateHuntDto, @CurrentUser() user: AuthenticatedUser) { ... }
```
Le décorateur `@Auth(Role.PARTNER, Role.ADMIN)` déclenche deux guards :

1. **`JwtAuthGuard`** (extend `AuthGuard('jwt')`)
   - Délègue à `JwtStrategy` qui lit `Authorization: Bearer <token>`.
   - Vérifie la signature avec `jwt.secret`.
   - `validate({ sub, role })` retourne `{ id: sub, role }`.
   - Passport injecte cet objet dans `request.user`.
   - Si token absent ou invalide → `UnauthorizedException` (401).

2. **`RolesGuard`**
   - Lit `ROLES_KEY` via `Reflector` (metadata posée par `@Roles(...)` inclus
     dans `@Auth(...)`).
   - Compare à `request.user.role`. Si mismatch → `ForbiddenException` (403).

### 4. Interceptors
Aucun.

### 5. DTO validation
`CreateHuntDto` validé :
- `title` : `@MinLength(3) @MaxLength(200)`
- `description` optionnel
- `location` optionnel `@MaxLength(300)`
- `lat` : `@IsNumber() @Min(-90) @Max(90)` après transformation
- `lng` : `@IsNumber() @Min(-180) @Max(180)` après transformation
- `difficulty` : `@IsIn(['easy', 'medium', 'hard'])`
- `duration`, `points` : bornés
- `is_active` : `@IsBoolean()`

`whitelist: true` retire les propriétés non listées. `forbidNonWhitelisted: true`
rejette la requête si elle contient des champs inconnus.

### 6. Controller
```ts
return this.huntsService.createHunt(user.id, dto);
```
`@CurrentUser()` est un `createParamDecorator` qui retourne `request.user`.

### 7. Service
```ts
createHunt(partnerId: string, dto: CreateHuntDto): Promise<HuntEntity> {
  const coordinates =
    dto.lat !== undefined && dto.lng !== undefined
      ? { type: 'Point', coordinates: [dto.lng, dto.lat] }
      : null;
  return this.huntsRepository.save({
    partner_id: partnerId,
    title: dto.title,
    description: dto.description ?? null,
    location: dto.location ?? null,
    coordinates,
    difficulty: dto.difficulty ?? null,
    duration: dto.duration ?? null,
    points: dto.points ?? 0,
    is_active: dto.is_active ?? false,
  });
}
```
**Important** : le payload GeoJSON est `[lng, lat]` (ordre PostGIS), pas `[lat, lng]`.

### 8. Repository
`HuntsRepository.save(partial)` → `this.repo.save(...)` (TypeORM).
TypeORM génère le SQL `INSERT INTO hunts (...) VALUES (...) RETURNING *`.
Le driver pg envoie le GeoJSON sur la colonne `geography`.

### 9. PostgreSQL
La ligne est insérée, `id` généré, `created_at` renvoyé.

### 10. Mapping
Nest sérialise directement l'entité. (Pas de DTO de sortie côté `createHunt`.)

### 11. Filter
Pas d'erreur.

### 12. Réponse
`201 Created` + corps `HuntEntity` en JSON.

---

## Exemple 3 — Route protégée avec ownership check et PostGIS : valider une étape

Route : `POST /hunts/:id/steps/:stepId/validate`
Auth : JWT obligatoire (n'importe quel rôle).
Body : `{ "lat": 48.8566, "lng": 2.3522 }`

### 1-3. Express + Throttler + Guards
- `@Auth()` (sans rôle) → uniquement `JwtAuthGuard` actif.
- `request.user` = `{ id, role }`.

### 5. DTO
`ValidateStepDto` : `lat` et `lng` obligatoires, bornes ±90/±180.

### 6. Controller
```ts
return this.progressService.validateStep(user.id, huntId, stepId, dto);
```

### 7. Service — `ProgressService.validateStep`
Étapes successives (lectures puis écriture) :
1. `progressRepository.findByUserAndHunt(user.id, huntId)` → 404 si absent.
2. `stepsRepository.findById(stepId)` → 404 si absent ou pas lié à la chasse.
3. Vérif : étape pas déjà dans `completed_steps` → 409 sinon.
4. Vérif : `step.order === progress.current_step` → 400 sinon.
5. Vérif : `step.location` non null → 400 sinon.
6. **PostGIS** : `geoService.isWithinRadius(lat, lng, step.location, step.validation_radius)` :
   ```sql
   SELECT ST_DWithin(
     $1::geography,
     ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
     $4
   ) AS within
   ```
   Si `false` → 400 `Player is not within validation radius`.
7. `huntsRepository.findByIdWithSteps(huntId)` pour connaître le nombre total
   d'étapes et les points.
8. `pointsEarned = floor(hunt.points / (completed_steps.length + 1))`.
9. `newCompletedSteps = [...progress.completed_steps, step.order]`.
10. `isHuntComplete = totalSteps > 0 && newCompletedSteps.length === totalSteps`.
11. `progressRepository.save({...})` avec `current_step + 1`, `total_points + pointsEarned`,
    `completed_at = now()` si complète.
12. Si complète : `findAllByUser(userId)` → compte `completed_at !== null` →
    `badgesService.checkAndAwardHuntBadges(userId, completedCount)` qui attribue
    `hunt_completed` toujours et `first_hunt` si `completedCount === 1`.

### 10. Mapping
Retourne l'entité `ProgressEntity` mise à jour, sérialisée directement.

### 11. Filter
Toutes les exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`)
sont capturées par `HttpExceptionFilter` et uniformisées :
```json
{
  "statusCode": 400,
  "message": "Player is not within validation radius",
  "timestamp": "2026-04-10T12:34:56.789Z",
  "path": "/hunts/xxx/steps/yyy/validate"
}
```

### 12. Réponse
`200 OK` + `ProgressEntity` à jour.

---

## Règles transverses observées dans le code

### RGPD / GPS
- `ProgressService.getProgressWithSteps` lit `user.consent_gps` :
  les coordonnées des étapes ne sont exposées **que** si `consent_gps === true`
  **ET** l'étape est `current` ou `completed`. Les étapes `locked` n'ont
  jamais de coordonnées.
- Les coordonnées du joueur envoyées pour validation ne sont **jamais stockées** :
  elles sont consommées par `ST_DWithin` puis jetées.

### Ownership partenaire
- `HuntsService.updateHunt / deleteHunt / getStats / getParticipants`
  compare `hunt.partner_id` à `partnerId`. En cas de mismatch, retourne
  `NotFoundException` (et non `Forbidden`) pour éviter l'énumération.
- `StepsService.assertHuntOwnership` fait la même vérification.
- `ZonesService` utilise `ForbiddenException` sur les mutations (écart de style
  par rapport aux autres modules).

### Mode invité
- `GET /hunts`, `GET /hunts/:id`, `GET /hunts/:huntId/steps`, `GET /hunts/:huntId/zones`
  utilisent `JwtOptionalAuthGuard` et acceptent les requêtes sans token.

### Progression solo
- `POST /hunts/:id/join` / `POST /hunts/:id/steps/:stepId/validate` /
  `GET /hunts/:id/progress` imposent `@Auth()` : pas de sauvegarde en mode invité.
