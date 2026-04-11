# Backend Lootopia — Architecture

> Document généré à partir du code réel présent dans `packages/api/`.
> Toute information non présente dans le code est signalée comme telle.

---

## 1. Vue d'ensemble

Lootopia est un monorepo npm workspaces. Le backend vit dans `packages/api` et
expose une API REST NestJS qui alimente les applications mobile (joueurs) et
web (back-office partenaires et admin).

Le serveur est démarré via `packages/api/src/main.ts` qui :
- crée une instance `NestExpressApplication`,
- sert les fichiers uploadés sous `/uploads` (statiques),
- active un `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`),
- installe le filtre global `HttpExceptionFilter`,
- active CORS en lisant `process.env.CORS_ORIGIN` (défaut `http://localhost:5173`),
- écoute sur `process.env.PORT` (défaut `3000`).

## 2. Stack technique (ce qui est réellement installé et utilisé)

| Couche | Techno |
|---|---|
| Runtime | Node.js, NestJS |
| HTTP | `@nestjs/platform-express` |
| ORM | TypeORM (`@nestjs/typeorm`) |
| Base | PostgreSQL + PostGIS (colonnes `geography(Point, 4326)`) |
| Auth | `@nestjs/jwt` + `passport-jwt`, hash `bcrypt` |
| Validation | `class-validator` + `class-transformer` |
| Upload | `@nestjs/platform-express` + `multer` (stockage disque) |
| Rate limiting | `@nestjs/throttler` (60 req/min/IP) |
| Tests | Jest |

## 3. Arborescence logique (`packages/api/src`)

```
src/
├── main.ts                         # bootstrap + pipes/filters/CORS globaux
├── app.module.ts                   # racine : TypeORM, Throttler, modules
├── app.controller.ts               # GET / healthcheck
├── app.service.ts
├── config/
│   ├── database.config.ts          # registerAs('database')
│   └── jwt.config.ts               # registerAs('jwt')
├── common/
│   ├── enums/role.enum.ts          # PLAYER | PARTNER | ADMIN
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   └── roles.decorator.ts         # @Roles() + ROLES_KEY
│   ├── guards/
│   │   ├── roles.guard.ts             # vérifie request.user.role
│   │   └── auth-roles.guard.ts        # @Auth(...roles) = JwtAuthGuard + RolesGuard
│   └── filters/
│       └── http-exception.filter.ts   # format JSON uniforme des erreurs
└── modules/
    ├── auth/        # register, login, JWT strategies
    ├── users/       # entity + repo + service (controller vide)
    ├── hunts/       # chasses + templates + stats + participants
    ├── steps/       # étapes nested sous /hunts/:huntId/steps
    ├── progress/    # progression joueur (exposée via HuntsController)
    ├── badges/      # attribution automatique (controller vide)
    ├── geo/         # requêtes PostGIS brutes
    ├── files/       # upload multipart disque
    ├── rgpd/        # /me/consent, DELETE /me
    ├── profile/     # /me/stats, /me/progress, /me/hunts, /me/badges
    ├── admin/       # /admin/stats (KPI globaux)
    ├── stats/       # /stats/hunts (KPI par chasse)
    └── zones/       # zones graphiques sur plan (nested sous hunts)
```

## 4. Rôle de chaque couche (appliqué à ce projet)

### 4.1 `main.ts`
- Bootstrap de l'application.
- `app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })` sert
  les fichiers uploadés par `FilesController`.
- `ValidationPipe` global : active `class-validator` sur tous les DTOs, rejette
  les propriétés non déclarées (`forbidNonWhitelisted: true`) et transforme les
  payloads (`transform: true`).
- `HttpExceptionFilter` global : uniformise le format d'erreur.

### 4.2 `app.module.ts`
- Charge `ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, jwtConfig] })`.
- Configure `TypeOrmModule.forRootAsync` avec `autoLoadEntities: true` et
  `synchronize` piloté par `database.synchronize` (via `NODE_ENV !== 'production'`).
- Configure `ThrottlerModule` : 60 requêtes/min.
- Importe tous les modules métier (Auth, Users, Hunts, Steps, Progress, Badges,
  Geo, Files, Rgpd, Profile, Admin, Stats, Zones).

### 4.3 Config (`src/config/`)
- `database.config.ts` lit `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- `jwt.config.ts` lit `JWT_SECRET` et `JWT_EXPIRES_IN` (défaut `7d`).

### 4.4 Modules NestJS
Chaque module applicatif suit le même squelette :
```
modules/<name>/
├── <name>.module.ts     # déclare controllers + providers, imports TypeOrmModule.forFeature
├── <name>.controller.ts # routes HTTP
├── <name>.service.ts    # logique métier
├── <name>.repository.ts # accès TypeORM (quand il y a une entité)
├── entities/            # classes @Entity() TypeORM
└── dto/                 # class-validator DTOs
```

### 4.5 Controllers
Les controllers **ne contiennent pas de logique métier**. Ils :
- déclarent la route (`@Controller('hunts')`, `@Get(':id')`, …),
- appliquent les guards (`@Auth(...)`, `@UseGuards(JwtOptionalAuthGuard)`),
- reçoivent le DTO validé et l'utilisateur courant,
- délèguent au service.

Exemples réels :
- `AuthController` → `/auth/register`, `/auth/login`
- `HuntsController` → CRUD chasses + templates + stats + participants + join + validate step
- `StepsController` → nested `/hunts/:huntId/steps`
- `ZonesController` → nested `/hunts/:huntId/zones`
- `ProfileController` → `@Controller('me') @Auth()` pour les vues joueur
- `RgpdController` → `@Controller('me') @Auth()` pour le consentement et la suppression
- `FilesController` → `/files/upload`
- `AdminController` → `@Auth(Role.ADMIN)` sur `/admin/stats`
- `StatsController` → `/stats/hunts`
- `AppController` → `GET /` healthcheck

### 4.6 Services
Portent la logique métier : vérification d'ownership partenaire (voir
`HuntsService.updateHunt`, `StepsService.assertHuntOwnership`, `ZonesService`),
calculs de stats, attribution de badges, etc.

### 4.7 Repositories
Un `*.repository.ts` par entité, qui enveloppe un `Repository<Entity>` TypeORM
injecté via `@InjectRepository`. Toutes les méthodes retournent des `Promise<Entity|null>`
et utilisent les accesseurs TypeORM (`findOneBy`, `find`, `save`, `delete`, `count`).

Cas particulier : `GeoService` n'est pas un repository. Il injecte directement
`@InjectDataSource()` et exécute des requêtes **SQL brutes PostGIS** (`ST_DWithin`,
`ST_Distance`, `ST_SetSRID`, `ST_MakePoint`).

### 4.8 DTOs
Tous les DTOs POST/PATCH utilisent `class-validator`. Exemples :
- `RegisterDto` : `@IsEmail()`, `@IsString() @MinLength(8)`, `@IsEnum(Role) @IsOptional()`.
- `CreateHuntDto` : `@MinLength(3) @MaxLength(200)`, `lat`/`lng` avec bornes ±90/±180,
  `difficulty` contraint à `'easy' | 'medium' | 'hard'` via `@IsIn`.
- `NearbyQueryDto` : `q`, `lat`, `lng`, `radius` (100 à 50 000 m), tous `@IsOptional`.
- `ValidateStepDto` : `lat`/`lng` obligatoires.
- `CreateStepDto` / `UpdateStepDto` : `order` int ≥ 0, `validation_radius` 10..10 000 m.
- `CreateZoneDto` / `UpdateZoneDto` : `shape` en `@IsObject()`.
- `UpdateConsentDto` : `@IsBoolean() consent_gps`.

### 4.9 Entities (TypeORM)
Six tables, toutes PK UUID (`@PrimaryGeneratedColumn('uuid')`).
Relations principales :
- `HuntEntity.partner` → `UserEntity` (ManyToOne, `onDelete: 'CASCADE'`)
- `StepEntity.hunt` → `HuntEntity` (ManyToOne, `onDelete: 'CASCADE'`)
- `HuntEntity.steps` → `StepEntity[]` (OneToMany)
- `ProgressEntity.user` → `UserEntity` (ManyToOne, `onDelete: 'CASCADE'`)
- `ProgressEntity.hunt` → `HuntEntity` (ManyToOne, `onDelete: 'CASCADE'`)
- `BadgeEntity.user` → `UserEntity` (ManyToOne, `onDelete: 'CASCADE'`)
- `ZoneEntity.hunt` → `HuntEntity` (ManyToOne, `onDelete: 'CASCADE'`)

Colonnes PostGIS :
- `HuntEntity.coordinates` — `geography(Point, 4326)` nullable.
- `StepEntity.location` — `geography(Point, 4326)` nullable.

RGPD / gameplay :
- `UserEntity.consent_gps: boolean` (défaut `false`) — vérifié dans
  `ProgressService.getProgressWithSteps` avant d'exposer les coordonnées.
- `StepEntity.ar_content: jsonb` — contenu RA configurable.

### 4.10 Guards
Trois guards principaux, tous dans `src/`, combinables :
- `JwtAuthGuard` (`auth/guards/jwt-auth.guard.ts`) — impose un JWT valide.
- `JwtOptionalAuthGuard` (`auth/guards/jwt-optional-auth.guard.ts`) — `handleRequest`
  override qui retourne `user` ou `null` sans jeter, permettant le **mode invité**.
- `RolesGuard` (`common/guards/roles.guard.ts`) — lit `ROLES_KEY` via `Reflector`
  et compare à `request.user.role`. Laisse passer si aucun rôle requis.

Le décorateur factory `@Auth(...roles)` applique `JwtAuthGuard` + `RolesGuard`
et, si des rôles sont passés, `@Roles(...)` comme metadata :
```ts
@Auth(Role.PARTNER, Role.ADMIN)
```
`@Auth()` (sans argument) exige juste l'authentification.

### 4.11 Strategies Passport
- `JwtStrategy` (`auth/strategies/jwt.strategy.ts`) : extrait le Bearer token,
  vérifie la signature avec `jwt.secret`, `validate(payload)` retourne
  `{ id: payload.sub, role: payload.role }` → injecté comme `request.user`.
- `JwtOptionalStrategy` (stratégie nommée `'jwt-optional'`) : identique mais
  utilisée par `JwtOptionalAuthGuard`.

### 4.12 Middleware
Aucun middleware Nest custom. Les middlewares globaux actifs sont :
- le `ValidationPipe` (pipe global, pas middleware au sens strict),
- le `HttpExceptionFilter` (filter global),
- CORS activé via `app.enableCors(...)`.

### 4.13 Interceptors
Aucun interceptor global custom.
Un interceptor Nest standard est utilisé ponctuellement :
`FileInterceptor('file', ...)` dans `FilesController.uploadFile` pour traiter
le multipart (`diskStorage`, `limits`, `fileFilter`).

### 4.14 Filters
`HttpExceptionFilter` (décorateur `@Catch()` global) :
```json
{
  "statusCode": 404,
  "message": "Hunt xyz not found",
  "timestamp": "2026-...",
  "path": "/hunts/xyz"
}
```

### 4.15 Tests
Jest. Spec files présents :
- `auth.service.spec.ts`, `jwt.strategy.spec.ts`, `jwt-optional.strategy.spec.ts`
- `users.service.spec.ts`, `user.entity.spec.ts`
- `hunts.service.spec.ts`, `hunt.entity.spec.ts`
- `steps.service.spec.ts`, `step.entity.spec.ts`
- `progress.service.spec.ts`, `progress.entity.spec.ts`
- `badges.service.spec.ts`, `badge.entity.spec.ts`
- `geo.service.spec.ts`
- `profile.service.spec.ts`
- `admin.service.spec.ts`
- `stats.service.spec.ts`
- `files.service.spec.ts`
- `rgpd.service.spec.ts`
- `zones.service.spec.ts`
- `current-user.decorator.spec.ts`, `auth-roles.guard.spec.ts`, `roles.guard.spec.ts`
- `http-exception.filter.spec.ts`

Exécution :
```bash
cd packages/api
npx jest                 # tous les tests
npx jest --testPathPatterns=zones   # filtrage par pattern (Jest ≥ 30)
```

## 5. Description synthétique des modules

### `AuthModule`
- Enregistre `JwtModule` (secret + `expiresIn`) et `PassportModule`.
- Expose `AuthController` : `POST /auth/register`, `POST /auth/login`.
- `AuthService` : hash bcrypt (12 rounds), signe JWT `{ sub, role }`.
- Pas d'endpoint de refresh token dans le code actuel.

### `UsersModule`
- `UserEntity` + `UsersRepository` + `UsersService`.
- `UsersController` présent mais vide (`// TODO: CRUD users`). Aucune route
  `/users` n'est réellement exposée.

### `HuntsModule`
- CRUD chasses : `POST /hunts`, `PATCH /hunts/:id`, `DELETE /hunts/:id`, `GET /hunts`,
  `GET /hunts/:id`.
- Recherche : `GET /hunts?q=...`.
- Chasses à proximité : `GET /hunts?lat=&lng=&radius=` → `GeoService.findHuntsNearby`.
- Templates : `GET /hunts/templates` et `POST /hunts/from-template/:templateId`
  (4 templates en dur dans `hunt-templates.constants.ts`).
- Stats partenaire : `GET /hunts/:id/stats`, `GET /hunts/:id/participants`.
- Progression joueur : `GET /hunts/:id/progress`, `POST /hunts/:id/join`,
  `POST /hunts/:id/steps/:stepId/validate` — ces 3 routes sont déclarées dans
  `HuntsController` mais délèguent à `ProgressService` injecté.
- Ownership : partner_id comparé à `user.id` sur update/delete/stats/participants.
  Retourne `NotFoundException` (pas `Forbidden`) en cas de mismatch pour éviter
  l'énumération.

### `StepsModule`
- `@Controller('hunts/:huntId/steps')`.
- CRUD steps, validation class-validator, vérification d'ownership via
  `HuntsRepository.findById`.
- `GET` public (`JwtOptionalAuthGuard`), `POST/PATCH/DELETE` réservés
  `PARTNER` ou `ADMIN`.
- Coordonnées stockées en GeoJSON `{ type: 'Point', coordinates: [lng, lat] }`
  sur colonne `geography`.

### `ProgressModule`
- **Pas d'endpoints propres** (`ProgressController` est vide).
- Expose `ProgressService` et `ProgressRepository` aux autres modules.
- Logique appelée depuis `HuntsController` :
  - `joinHunt` : empêche les doublons (`ConflictException`).
  - `validateStep` : vérifie étape courante, pas déjà validée, location configurée,
    puis `GeoService.isWithinRadius` (PostGIS `ST_DWithin`). Calcule les points
    gagnés, marque `completed_at` si toutes les étapes sont validées et appelle
    `BadgesService.checkAndAwardHuntBadges`.
  - `getProgressWithSteps` : respecte `consent_gps` avant d'exposer les
    coordonnées des étapes ; expose uniquement `current` et `completed` ;
    les étapes `locked` n'ont **pas** de coordonnées (gameplay + RGPD).

### `BadgesModule`
- `BadgesController` vide.
- `BadgesService` fournit `getUserBadges`, `awardBadge` idempotent,
  `checkAndAwardHuntBadges(userId, completedHuntsCount)` qui attribue
  `hunt_completed` systématiquement et `first_hunt` si `completedHuntsCount === 1`.
- Exposé au joueur via `GET /me/badges` (dans `ProfileController`).

### `GeoModule`
- Pas de controller, expose `GeoService`.
- `isWithinRadius(playerLat, playerLng, stepLocation, radius)` : requête brute
  `ST_DWithin` en paramétrant la location avec `JSON.stringify`.
- `findHuntsNearby(lat, lng, radius)` : requête brute
  `ST_DWithin(...) AND is_active = true AND coordinates IS NOT NULL`
  + `ST_Distance` dans le SELECT, trié par distance croissante.

### `FilesModule`
- `POST /files/upload` réservé PARTNER/ADMIN.
- `FileInterceptor('file')` avec `diskStorage`, nom de fichier `uuid + extension`,
  `limits.fileSize = MAX_SIZE_BYTES` (10 Mo).
- `ALLOWED_MIME_TYPES` : `image/jpeg`, `image/png`, `image/gif`, `image/webp`,
  `application/pdf`.
- Retourne `{ url: '/uploads/<filename>', filename, originalname, mimetype, size }`.
- Les fichiers sont servis en statique via `app.useStaticAssets`.

### `RgpdModule`
- `@Controller('me') @Auth()` :
  - `GET /me/consent` → `{ consent_gps: boolean }`
  - `PATCH /me/consent` avec body `{ consent_gps: boolean }`
  - `DELETE /me` → 204, supprime l'utilisateur (CASCADE sur hunts/progress/badges).

### `ProfileModule`
- `@Controller('me') @Auth()` (coexiste avec `RgpdController` — Nest gère très bien
  plusieurs controllers sur le même préfixe).
  - `GET /me/stats` → `{ total_points, hunt_count, completed_hunts, badge_count }`.
  - `GET /me/progress` → chasses en cours (filtrées `completed_at === null`).
  - `GET /me/hunts` → historique complet.
  - `GET /me/badges` → délègue à `BadgesService`.

### `AdminModule`
- `@Controller('admin') @Auth(Role.ADMIN)`.
- `GET /admin/stats` : `user_count`, `hunt_count`, `participant_count`,
  `completed_count`, `completion_rate`.

### `StatsModule`
- `@Controller('stats')`.
- `GET /stats/hunts` réservé PARTNER/ADMIN. PARTNER → ses chasses (`findAllForStats(userId)`),
  ADMIN → toutes (`findAllForStats(undefined)`). Pour chaque chasse :
  `participant_count`, `completed_count`, `completion_rate`, `average_points`.

### `ZonesModule`
- `@Controller('hunts/:huntId/zones')`.
- CRUD zones : `shape` stocké en `jsonb` (rect, circle ou polygon en coordonnées pixel).
- `GET` public (`JwtOptionalAuthGuard`), `POST/PATCH/DELETE` PARTNER/ADMIN
  avec ownership check (retourne `ForbiddenException`/`NotFoundException`).

## 6. Ce qui n'existe pas encore

Basé sur le code réellement présent dans la branche `feature/US22-zones-plan` :
- Pas de colonne `image_url` sur `HuntEntity` (US21 non mergée à cette date).
- `UsersController` est un squelette (`// TODO: CRUD users`). Aucune route
  `/users` publique.
- `ProgressController` est un squelette (`// TODO`). Les endpoints progression
  sont exposés sous `/hunts/:id/...`.
- `BadgesController` est un squelette. L'attribution est automatique côté service.
- Pas de stockage MinIO : l'upload est fait sur disque local dans `./uploads`.
- Pas de Winston configuré : les logs sortent sur la console Nest par défaut.
- Pas de swagger (`@nestjs/swagger`) activé.
