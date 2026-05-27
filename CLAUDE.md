# LootopiaV3 — Claude Code Context

> For detailed US status and anomalies → [`SUIVI_US.md`](./SUIVI_US.md)

---

## Tech Stack

| Layer            | Technology                           | Notes                                       |
| ---------------- | ------------------------------------ | ------------------------------------------- |
| Mobile           | React Native 0.83.2 + Expo 55        | nativewind 4, react-navigation 7            |
| Mobile state     | Zustand 5                            |                                             |
| Data fetching    | TanStack Query 5 + Axios             |                                             |
| Maps             | @maplibre/maplibre-react-native 10   |                                             |
| AR               | @reactvision/react-viro 2.53         |                                             |
| Backoffice/Admin | React 19 + Vite 7 + Tailwind 3       | Backoffice uses Radix UI                    |
| Charts           | Recharts 3                           |                                             |
| Backend          | NestJS 11                            | Node 20+                                    |
| ORM              | TypeORM 0.3                          |                                             |
| Database         | PostgreSQL 15 + PostGIS 3.3 (Docker) |                                             |
| Auth             | passport-jwt + bcrypt                |                                             |
| Validation       | class-validator + class-transformer  |                                             |
| Files            | multer (local storage `/uploads`)    |                                             |
| Tests API        | Jest 30 + ts-jest                    |                                             |
| Tests backoffice | Vitest                               | spec deviation — kept as-is                 |
| Tests admin      | none configured                      |                                             |
| Logs             | winston                              |                                             |
| Web forms        | react-hook-form + zod                |                                             |
| Shared types     | @lootopia/shared                     |                                             |
| Secure storage   | expo-secure-store ~13.0.0            | JWT stored via SecureStore in auth.store.ts |

---

## Infrastructure

- **Docker**: `docker-compose.yml` — postgres, pgadmin, minio, minio-init
- **PostgreSQL 15 + PostGIS 3.3**: image `postgis/postgis:15-3.3`
- **pgAdmin**: port 5050 — admin@lootopia.local / admin
- **MinIO**: S3 API port 9000, console port 9001 — minioadmin/minioadmin123
- **Seed**: `npm run seed -w packages/api`

---

## Backend Modules (`packages/api/src/modules/`)

| Module        | Contents                                                                   |
| ------------- | -------------------------------------------------------------------------- |
| `auth`        | module, controller, service, guard, strategies (jwt + jwt-optional), DTOs  |
| `users`       | module, controller, service, repository, entity, DTOs                      |
| `hunts`       | module, controller, service, repository, entity, DTOs, templates constants |
| `steps`       | module, controller, service, repository, entity, DTOs                      |
| `progress`    | module, controller, service, repository, entity, DTOs                      |
| `badges`      | module, controller, service, repository, entity                            |
| `geo`         | module, service (PostGIS ST_DWithin)                                       |
| `files`       | module, controller, service                                                |
| `profile`     | module, controller, service, DTOs                                          |
| `rgpd`        | module, controller, service, DTOs                                          |
| `admin`       | module, controller, service                                                |
| `stats`       | module, controller, service                                                |
| `zones`       | module, controller, service, repository, entity, DTOs                      |
| `invitations` | module, repository, service, entity, DTO                                   |
| `mail`        | module, service (console.log in dev)                                       |

**Common**: `role.enum.ts`, `@Roles()`, `@CurrentUser()`, `JwtAuthGuard`, `JwtOptionalAuthGuard`, `RolesGuard`, `AuthRolesGuard`, `HttpExceptionFilter`

---

## Frontend Applications

### `apps/mobile` — React Native + Expo

- **Navigation**: RootNavigator, AppNavigator, AuthNavigator
- **Screens**: auth (Login, Register), guest (ConvertAccount), map (Map, HuntBottomSheet), hunts (HuntDetail, HuntsList, StepValidation, HuntCompletion), profile (Profile, Badges, Settings, Security)
- **Services**: api.ts, auth.service.ts, hunt.service.ts, progress.service.ts, profile.service.ts
- **Hooks**: useAuth, useLocation, useHunts, useProfile
- **Store**: auth.store.ts, hunts.store.ts

### `apps/backoffice` — React + Vite (partner portal)

- **Pages**: Login, Dashboard, Hunts, HuntCreate, HuntEdit, Steps, Stats, Settings
- **Components**: layout, hunt (HuntForm, HuntManager, StepEditor), step (StepForm), stats (StatsViewer), zone (ZoneForm), ui (Radix-based)
- **Services**: auth, hunts, steps, zones, files, stats, profile
- **Tests**: Vitest — LoginPage, HuntsPage, StepsPage, all services, store

### `apps/admin` — React + Vite (internal admin)

- **Pages**: Login, Dashboard (stub), Users (stub), Partners (stub), Hunts (stub), Badges (stub), Invitations
- **Services**: api.ts, auth.service, invitations.service
- **Store**: auth.store (Zustand)
- **No tests configured**

---

## Shared Packages (`packages/shared`)

Types: `user.types.ts`, `hunt.types.ts`, `step.types.ts`, `progress.types.ts`, `badge.types.ts`, `api.types.ts`, `geo.types.ts` — barrel export via `src/index.ts`.

---

## Development Rules

### Strict scope

Implement only what the US requires. No extras.

### TDD — mandatory for every feature and fix

Follow Red → Green → Refactor strictly:

1. **Write the failing test first** — before any implementation code
2. **Write the minimal code** to make it pass
3. **Refactor** without breaking the test

**API (Jest 30 + ts-jest)**

- Unit tests for every service method: `*.service.spec.ts`
- Place spec files alongside the source file
- Mock repositories with `jest.fn()` — no real DB in unit tests
- Run: `npm run test -w packages/api`

**Backoffice (Vitest)**

- Unit tests for every service and key page
- Run: `npm run test -w apps/backoffice`

**Rules**

- No feature or fix is complete without tests
- Tests go in before the implementation commit
- Aim for meaningful coverage of the US logic, not 100% line coverage
- Ultra-compressed mode. Active every response until `stop caveman` or `normal mode`. Drop articles, filler, pleasantries, hedging. Fragments OK. Keep technical accuracy exact. Pattern: `[thing] [action] [reason]. [next step].` Use short words, preserve code/errors/API names unchanged. Example: `New object ref each render. Inline object prop = new ref = re-render. Wrap in useMemo.`

### GDPR

`consent_gps` required. No raw coordinates stored. Guest mode supported. Cascade delete on account removal.

### Fixed stack

Never substitute: no Prisma, Redux, Next.js, Zod for DTOs, localStorage for JWT.

### TypeScript

No `any` without justification. `class-validator` required on all NestJS DTOs.

### Guards

Reuse existing: `JwtAuthGuard`, `JwtOptionalAuthGuard`, `RolesGuard`, `@Auth()`, `@CurrentUser()`.

### Shared files

Flag explicitly before modifying `app.module.ts` or shared types.

### SUIVI_US.md — mandatory update after every US

After implementing or partially implementing any US, update its row in `SUIVI_US.md`:
- Status icon (✅ / ⚠️ / 🔌 / ❌)
- "Ce qui manque / problème" column — reflect the new state
- "À faire" section — check the box if done, or update remaining items
- Update "Dernière mise à jour" date at the top of the file

---

## Git Workflow

### Before any implementation

1. Check current branch: `git branch --show-current`
2. If on `develop` or `main`, create a feature branch first:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/USxx-short-description
   ```
3. Never commit directly to `develop` or `main`

### Branch naming

| Type    | Format                           | Example                           |
| ------- | -------------------------------- | --------------------------------- |
| New US  | `feature/USxx-kebab-description` | `feature/US55-qr-code-validation` |
| Bug fix | `fix/kebab-description`          | `fix/duplicate-react-admin`       |
| Docs    | `docs/kebab-description`         | `docs/contributing-guide`         |

### Commit format

```
type(scope): USxx — short description in English

# Types: feat, fix, docs, refactor, test, chore
# Scope: api, mobile, backoffice, admin, shared
```

**Never** add `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` (or any Claude co-author line) to commits.

### Pull Requests

- One branch = one US (or one atomic fix)
- PR always targets `develop`, never `main`
- `main` = stable production, merged from `develop` only after validation

### Recovery (accidental commit on develop)

```bash
git branch feature/USxx-description   # save the commit
git reset --hard HEAD~1               # remove it from develop
git checkout feature/USxx-description # back to the right branch
```
