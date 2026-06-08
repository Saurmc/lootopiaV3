# Contributing to LootopiaV3

Guidelines for working on this project — applies to all contributors and Claude Code sessions.

---

## Git Workflow

### Branch strategy

This project follows a `develop` → `main` flow.

| Branch | Role |
|---|---|
| `main` | Production. Never commit here directly. |
| `develop` | Integration branch. Never commit directly — always go through a PR. |
| `feature/*` | One user story or atomic feature per branch. |
| `fix/*` | Bug fix (not tied to a specific US). |
| `docs/*` | Documentation-only changes. |

### Starting work on a new US

Always start from an up-to-date `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/USxx-short-description
```

**Never start implementation without a dedicated branch.** Committing directly on `develop` or `main` is not allowed.

### Branch naming convention

| Type | Format | Example |
|---|---|---|
| User story | `feature/USxx-kebab-description` | `feature/US55-qr-code-validation` |
| Bug fix | `fix/kebab-description` | `fix/duplicate-react-admin` |
| Documentation | `docs/kebab-description` | `docs/contributing-guide` |

Rules:
- Lowercase only, words separated by `-`
- Include the US number when the work maps to a user story
- Keep it short (3–5 words after the type prefix)

---

## Commit Messages

### Format

```
type(scope): USxx — short description in English
```

- **type**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- **scope**: `api`, `mobile`, `backoffice`, `admin`, `shared` — combine with `+` if multi-scope
- **USxx**: include when the commit is tied to a user story (omit for infra/docs work)
- **description**: imperative, lowercase, no period at the end

### Examples

```
feat(api+backoffice): US03 — partner invitation flow
fix(admin): resolve duplicate React instance in Vite config
test(api): US03 — invitation service unit tests
docs: add git workflow section to CLAUDE.md
chore(api): add multer and winston to explicit dependencies
```

### Rules

- Write in **English**
- Keep the subject line under **72 characters**
- One logical change per commit — do not bundle unrelated changes
- Do not include internal implementation details (API routes, file names) in the subject line — put those in the PR description

---

## Pull Requests

### Process

1. Push your feature branch: `git push -u origin feature/USxx-description`
2. Open a PR from `feature/USxx-description` → `develop`
3. Title: same format as the commit (`feat(scope): USxx — description`)
4. Description: what changed, why, how to test, any known limitations
5. Never target `main` directly

### PR checklist

- [ ] One US (or one atomic fix) per PR
- [ ] Tests written or updated for the changed logic
- [ ] No `console.log` left in production code (allowed in `mail.service.ts` dev mode)
- [ ] TypeScript: no `any` without a documented reason
- [ ] DTO validation: `class-validator` decorators on all NestJS DTOs

---

## Recovering from a wrong-branch commit

If you committed on `develop` by mistake and **have not pushed yet**:

```bash
# 1. Capture the commit on a new branch
git branch feature/USxx-description

# 2. Remove the commit from develop
git reset --hard HEAD~1

# 3. Switch to the correct branch
git checkout feature/USxx-description
```

If the commit **was already pushed**, do not force-push `develop`. Contact the team.

---

## Project-specific rules

These rules are enforced in every Claude Code session (see [`CLAUDE.md`](./CLAUDE.md)):

- **Stack is fixed**: do not substitute libraries (no Prisma, Redux, Next.js, localStorage for JWT, Zod for NestJS DTOs)
- **RGPD first**: `consent_gps` required before storing any coordinates; guest mode must always be possible
- **Scope discipline**: implement only the requested US — no bonus features, no refactors outside the task
- **Guards**: reuse existing `JwtAuthGuard`, `JwtOptionalAuthGuard`, `RolesGuard`, `@CurrentUser()` — do not roll your own
- **Tests**: Jest for API, Vitest for backoffice — always add tests for new service logic
- **TypeScript strict**: `strict: true` is enabled — no implicit `any`
- **Shared types**: changes to `packages/shared` types affect all apps — signal before modifying

---

## Local setup

See [`README.md`](./README.md) or [`lootopia_setup_copilot.txt`](./lootopia_setup_copilot.txt) for Docker, database, and environment setup instructions.
