# Lootopia — Modèle de base de données

> Généré à partir des entités TypeORM réellement présentes dans
> `packages/api/src/modules/*/entities/`. Aucune relation, colonne ou
> contrainte n'est inventée.

Moteur : **PostgreSQL** + extension **PostGIS** (colonnes `geography(Point, 4326)`).

TypeORM est configuré avec `autoLoadEntities: true` et `synchronize: true` en
développement (hors `NODE_ENV=production`). Les colonnes physiques correspondent
directement aux décorateurs présents dans les entités.

## Tables

6 tables :
1. `users`
2. `hunts`
3. `steps`
4. `progress`
5. `badges`
6. `zones`

---

## `users` — `UserEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, `DEFAULT gen_random_uuid()` (`@PrimaryGeneratedColumn('uuid')`) | |
| `email` | `varchar` | `UNIQUE`, `NULL` autorisé | Nullable pour supporter le mode invité |
| `password_hash` | `varchar` | `NULL` autorisé | bcrypt (12 rounds) |
| `role` | `enum('PLAYER','PARTNER','ADMIN')` | `DEFAULT 'PLAYER'` | `common/enums/role.enum.ts` |
| `consent_gps` | `boolean` | `DEFAULT false` | **RGPD** : vérifié avant d'exposer des coordonnées |
| `created_at` | `timestamp` | `@CreateDateColumn` | |
| `updated_at` | `timestamp` | `@UpdateDateColumn` | |

**Relations sortantes implicites (via FK sur d'autres tables)** :
- `hunts.partner_id → users.id` (CASCADE)
- `progress.user_id → users.id` (CASCADE)
- `badges.user_id → users.id` (CASCADE)

---

## `hunts` — `HuntEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `partner_id` | `uuid` | FK → `users.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `title` | `varchar` | NOT NULL | 3..200 car via DTO |
| `description` | `text` | NULL | |
| `location` | `varchar` | NULL | libellé textuel |
| `coordinates` | `geography(Point, 4326)` | NULL | **PostGIS** — GeoJSON `Point` `[lng, lat]` |
| `difficulty` | `varchar` | NULL | valeurs applicatives `easy|medium|hard` |
| `duration` | `int` | NULL | minutes |
| `points` | `int` | `DEFAULT 0` | |
| `is_active` | `boolean` | `DEFAULT false` | |
| `created_at` | `timestamp` | `@CreateDateColumn` | |

**Relations** :
- `partner_id → users.id` (ManyToOne, CASCADE)
- `steps` : OneToMany vers `steps`
- (zones, progress référencent `hunts.id` en CASCADE)

**Notes d'usage (code)** :
- `HuntsRepository.findAll()` filtre `is_active = true`.
- `HuntsRepository.search(q)` : `LOWER(title) LIKE :q OR LOWER(description) LIKE :q`.
- `GeoService.findHuntsNearby` : `WHERE is_active AND coordinates IS NOT NULL AND ST_DWithin(...)`.

---

## `steps` — `StepEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `hunt_id` | `uuid` | FK → `hunts.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `order` | `int` | NOT NULL | ≥ 0 via DTO |
| `title` | `varchar` | NOT NULL | 2..200 car via DTO |
| `description` | `text` | NULL | |
| `location` | `geography(Point, 4326)` | NULL | **PostGIS** |
| `validation_radius` | `int` | `DEFAULT 50` | mètres, 10..10 000 via DTO |
| `ar_content` | `jsonb` | NULL | contenu RA configurable |
| `created_at` | `timestamp` | `@CreateDateColumn` | |

**Relations** :
- `hunt_id → hunts.id` (ManyToOne, CASCADE)

**Notes d'usage (code)** :
- `StepsRepository.findByHuntId(huntId)` : utilisé pour lister et ordonner par `order`.
- `ProgressService.validateStep` appelle `GeoService.isWithinRadius(lat, lng, step.location, step.validation_radius)`.

---

## `progress` — `ProgressEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → `users.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `hunt_id` | `uuid` | FK → `hunts.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `current_step` | `int` | `DEFAULT 0` | index de l'étape courante |
| `completed_steps` | `int[]` | `DEFAULT '{}'` | tableau d'`order` d'étapes validées |
| `total_points` | `int` | `DEFAULT 0` | |
| `started_at` | `timestamp` | `@CreateDateColumn` | |
| `completed_at` | `timestamp` | NULL | rempli quand toutes les étapes sont validées |

> Pas de contrainte d'unicité `(user_id, hunt_id)` déclarée dans l'entité,
> mais `ProgressService.joinHunt` vérifie manuellement et jette `ConflictException`.

---

## `badges` — `BadgeEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → `users.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `badge_type` | `varchar` | NOT NULL | valeurs applicatives : `hunt_completed`, `first_hunt` |
| `earned_at` | `timestamp` | `@CreateDateColumn` | |

> L'unicité `(user_id, badge_type)` n'est pas contrainte en base mais garantie
> applicativement par `BadgesService.awardBadge` (lookup + no-op si existant).

---

## `zones` — `ZoneEntity`

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `hunt_id` | `uuid` | FK → `hunts.id`, ManyToOne `onDelete: 'CASCADE'` | |
| `label` | `varchar` | NULL | |
| `shape` | `jsonb` | NOT NULL | `ZoneShape` : `{ type: 'rect'\|'circle'\|'polygon', ... }` en coordonnées pixel du plan |
| `order` | `int` | `DEFAULT 0` | |
| `created_at` | `timestamp` | `@CreateDateColumn` | |

---

## Résumé des relations (orienté CASCADE)

```
users (1) ─── CASCADE ───▶ (N) hunts        (partner_id)
users (1) ─── CASCADE ───▶ (N) progress     (user_id)
users (1) ─── CASCADE ───▶ (N) badges       (user_id)

hunts (1) ─── CASCADE ───▶ (N) steps        (hunt_id)
hunts (1) ─── CASCADE ───▶ (N) progress     (hunt_id)
hunts (1) ─── CASCADE ───▶ (N) zones        (hunt_id)
```

Conséquence : `DELETE FROM users WHERE id = $1` nettoie en cascade les chasses
créées par un partenaire, leurs étapes et zones, ses progressions et badges.

---

## Champs RGPD

| Champ | Usage |
|---|---|
| `users.email` nullable | Permet le mode invité (compte sans email). |
| `users.password_hash` nullable | idem (pas de mot de passe en invité). |
| `users.consent_gps` | **Verrouille** l'exposition des coordonnées dans `GET /hunts/:id/progress`. |
| `onDelete: 'CASCADE'` | Garantit que `DELETE /me` supprime toutes les données liées. |
| `StepEntity.location` non exposée via `HuntDetailDto` | Les positions exactes des étapes ne sont révélées qu'en cours de gameplay. |
| Coordonnées joueur non stockées | `ValidateStepDto` (`lat`, `lng`) est consommé par `ST_DWithin` puis jeté. |

## Champs PostGIS

| Table.colonne | Type | Décorateur |
|---|---|---|
| `hunts.coordinates` | `geography(Point, 4326)` | `@Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })` |
| `steps.location` | `geography(Point, 4326)` | idem |

Requêtes SQL utilisées (dans `GeoService`) :
```sql
-- Chasses dans un rayon, triées par distance
ST_DWithin(h.coordinates::geography, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography, $radius)
ST_Distance(h.coordinates::geography, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography)

-- Validation de proximité d'un joueur
ST_DWithin($stepLocation::geography, ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography, $radius)
```

## Diagramme ERD

Voir [database-erd.mmd](./database-erd.mmd) (Mermaid `erDiagram`).
