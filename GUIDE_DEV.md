# Guide développeur — LootopiaV3
> Fichier personnel, ignoré par git. Dernière mise à jour : 2026-06-02.

---

## Table des matières
1. [C'est quoi ce projet ?](#1-cest-quoi-ce-projet-)
2. [Architecture en un coup d'œil](#2-architecture-en-un-coup-dœil)
3. [Prérequis installés sur ta machine](#3-prérequis-installés-sur-ta-machine)
4. [Démarrer l'environnement complet](#4-démarrer-lenvironnement-complet)
5. [Lancer chaque application](#5-lancer-chaque-application)
6. [Comptes de test (seed)](#6-comptes-de-test-seed)
7. [Tester les endpoints API](#7-tester-les-endpoints-api)
8. [Tester l'envoi d'emails (Mailtrap)](#8-tester-lenvoi-demails-mailtrap)
9. [Lancer les tests automatisés](#9-lancer-les-tests-automatisés)
10. [Problèmes fréquents et solutions](#10-problèmes-fréquents-et-solutions)
11. [Démo — Validation AR avec QR code (US12)](#11-démo--validation-ar-avec-qr-code-us12)
12. [Architecture RA — US12 vs US63 (futur)](#12-architecture-ra--us12-vs-us63-futur)
13. [Écrire des prompts efficaces pour Claude Code](#13-écrire-des-prompts-efficaces-pour-claude-code)

---

## 1. C'est quoi ce projet ?

Lootopia est une application de **chasses au trésor géolocalisées**. Elle est découpée en 4 parties :

| Application | Pour qui ? | Ce qu'elle fait |
|---|---|---|
| **Backend (API)** | Personne ne l'utilise directement | Cerveau de l'app. Répond aux requêtes des 3 autres. |
| **Mobile** | Les joueurs | Voir la carte, rejoindre des chasses, valider des étapes |
| **Backoffice** | Les partenaires (ex : musée, parc) | Créer et gérer leurs chasses au trésor |
| **Admin** | L'administrateur de la plateforme | Superviser tous les utilisateurs et toutes les chasses |

C'est un **monorepo** : tout est dans un seul dossier, mais c'est 4 projets indépendants.

---

## 2. Architecture en un coup d'œil

```
lootopiaV3/
├── packages/
│   ├── api/          ← Backend NestJS (le serveur)
│   └── shared/       ← Types TypeScript partagés entre les apps
├── apps/
│   ├── mobile/       ← App React Native / Expo (les joueurs)
│   ├── backoffice/   ← Site web partenaires (React + Vite)
│   └── admin/        ← Site web admin (React + Vite)
├── docker-compose.yml ← Lance PostgreSQL + pgAdmin + MinIO
└── package.json      ← Racine du monorepo (npm workspaces)
```

**Comment les apps se parlent :**
```
Mobile ──────────────┐
Backoffice ──────────┼──→ API (port 3000) ──→ PostgreSQL (port 5432)
Admin ───────────────┘
```

---

## 3. Prérequis installés sur ta machine

| Outil | Vérifie avec | Notes |
|---|---|---|
| Node.js 20+ | `node -v` | Nécessaire pour tout |
| npm | `npm -v` | Inclus avec Node |
| Docker Desktop | Icône dans la barre de menu | Pour la BDD + MinIO |
| Expo Go | Sur ton iPhone/Android | Pour tester le mobile sur vrai appareil |

**PostgreSQL natif (Homebrew) :** tu l'as mais **ne l'utilise pas** pour ce projet.
Utilise toujours la version Docker qui a PostGIS intégré.

---

## 4. Démarrer l'environnement complet

### Étape 1 — Ouvrir Docker Desktop
Ouvre l'application Docker Desktop depuis tes Applications. Attends que l'icône de la baleine soit stable.

### Étape 2 — Lancer la base de données
Depuis la racine du projet (`lootopiaV3/`) :
```bash
docker-compose up -d
```
Cela lance 3 conteneurs :
- `lootopia_postgres` → la base de données PostgreSQL avec PostGIS
- `lootopia_pgadmin` → interface web pour voir la BDD (optionnel)
- `lootopia_minio` → stockage de fichiers (photos, plans)

Vérifie que ça tourne :
```bash
docker ps
```
Tu dois voir les 3 conteneurs avec le statut `Up`.

### Étape 3 — Configurer les variables d'environnement
Copie `.env.example` → `.env` dans `packages/api/` si ce n'est pas déjà fait.

Pour les **emails d'invitation partenaire**, renseigne les credentials Mailtrap
(mailtrap.io → Email Testing → Inboxes → SMTP Settings) :
```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<ton username>
SMTP_PASS=<ton password>
```
Sans ces vars, le lien d'activation est loggué en console (mode dégradé).

### Étape 4 — Lancer le backend
Dans un terminal dédié, depuis `packages/api/` :
```bash
npm run start:dev
```
Attend de voir : `Nest application successfully started`

Le backend tourne sur `http://localhost:3000`.

### Étape 5 — Lancer l'app voulue (voir section suivante)

---

## 5. Lancer chaque application

### Backoffice (interface partenaires)
```bash
cd apps/backoffice
npm run dev
```
Ouvre `http://localhost:5173` dans ton navigateur.

### Admin
```bash
cd apps/admin
npm run dev
```
Si le backoffice tourne déjà sur 5173, Vite prend automatiquement le port `5174`.
Ouvre `http://localhost:5174`.

> **Attention CORS :** Le backend n'autorise que `http://localhost:5173` par défaut.
> Si tu accèdes à l'admin sur le port 5174, les requêtes API seront bloquées.
> Solution : ajoute `CORS_ORIGIN=http://localhost:5174` dans `packages/api/.env`
> puis relance le backend. (Ou lance l'admin en premier avant le backoffice.)

### Mobile
```bash
cd apps/mobile
npm start
```
Expo affiche un QR code dans le terminal. Options :
- **Sur ton téléphone** : scanne le QR avec l'app **Expo Go** (iOS/Android)
- **Sur simulateur iOS** : appuie sur `i` dans le terminal (nécessite Xcode)
- **Sur émulateur Android** : appuie sur `a` (nécessite Android Studio)

> Sur Android (vrai appareil ou émulateur), l'URL de l'API est automatiquement
> redirigée vers `http://10.0.2.2:3000` à la place de `localhost:3000`.
> Ça fonctionne tout seul, rien à changer.

---

## 6. Comptes de test (seed)

D'abord, peupler la base de données avec des données de démo :
```bash
cd packages/api
npm run seed
```
Cette commande crée des utilisateurs, des chasses, des étapes, etc.
Elle est **idempotente** : tu peux la relancer sans problème, elle écrase les données de seed existantes.

### Comptes créés

| Rôle | Email | Mot de passe | Où se connecter |
|---|---|---|---|
| Admin | admin@lootopia.fr | Admin1234 | App Admin |
| Partenaire 1 (Musée) | musee@lootopia.fr | Partner123 | Backoffice |
| Partenaire 2 (Parc) | parc@lootopia.fr | Partner123 | Backoffice |
| Joueur 1 | alice@example.com | Player123 | Mobile |
| Joueur 2 | bob@example.com | Player123 | Mobile |
| Joueur 3 | charlie@example.com | Player123 | Mobile (pas de GPS) |

---

## 7. Tester les endpoints API

### Via le navigateur (GET seulement)
`http://localhost:3000/` → doit retourner `{"status":"ok"}`

### Via curl (terminal)
```bash
# Connexion → récupère un token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Player123"}'

# Utilise le token pour appeler un endpoint protégé
curl http://localhost:3000/me/profile \
  -H "Authorization: Bearer TON_TOKEN_ICI"
```

### Endpoints principaux
| Méthode | URL | Description | Auth requise |
|---|---|---|---|
| POST | `/auth/register` | Inscription | Non |
| POST | `/auth/login` | Connexion | Non |
| POST | `/auth/guest` | Connexion invité | Non |
| GET | `/hunts` | Liste des chasses | Non |
| GET | `/hunts/:id` | Détail d'une chasse | Non |
| POST | `/hunts/:id/join` | Rejoindre une chasse | Oui |
| POST | `/hunts/:id/steps/:stepId/validate` | Valider une étape | Oui |
| GET | `/me/profile` | Mon profil | Oui |
| GET | `/me/badges` | Mes badges | Oui |
| GET | `/admin/stats` | Stats globales | Oui (Admin) |

---

## 8. Tester l'envoi d'emails (Mailtrap)

### Étape 1 — Créer un compte et récupérer les credentials

1. Va sur [mailtrap.io](https://mailtrap.io) et crée un compte gratuit
2. **Email Testing** → **Inboxes** → clique sur l'inbox "Demo inbox"
3. Onglet **SMTP Settings** → dans le menu déroulant **Integrations**, sélectionne **Nodemailer**
4. Tu obtiens les valeurs `host`, `port`, `user`, `pass`

### Étape 2 — Renseigner le `.env`

Dans `packages/api/.env` :
```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<user copié depuis Mailtrap>
SMTP_PASS=<pass copié depuis Mailtrap>
SMTP_FROM=noreply@lootopia.fr
```
**Redémarre le backend** après toute modification du `.env`.

### Étape 3 — Déclencher un mail d'invitation

**Via l'interface admin (recommandé) :**
1. Ouvre `http://localhost:5174` → connecte-toi avec `admin@lootopia.fr` / `Admin1234`
2. Menu **Invitations partenaires** → saisis un email quelconque → clique **Envoyer**
3. L'interface affiche "Invitation envoyée" → le mail part vers Mailtrap

**Via curl (sans navigateur) :**
```bash
# 1. Récupérer un token admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lootopia.fr","password":"Admin1234"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Envoyer l'invitation
curl -X POST http://localhost:3000/admin/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"test@example.com","partnerName":"Test Partenaire"}'
```

### Étape 4 — Vérifier dans Mailtrap

1. Retourne sur [mailtrap.io](https://mailtrap.io) → **Email Testing** → **Inboxes** → ton inbox
2. Le mail **"Invitation à rejoindre Lootopia"** doit apparaître en quelques secondes
3. Clique dessus pour voir le rendu HTML et copier le lien d'activation
4. Ouvre ce lien dans le navigateur → tu arrives sur `http://localhost:5173/register?token=...`

### Dépannage email

| Symptôme | Cause probable | Solution |
|---|---|---|
| Aucun mail reçu + logs console | `SMTP_HOST` vide ou absent | Vérifier `.env` et redémarrer le backend |
| `Error: Invalid login` dans les logs | Mauvais user/pass | Recopier depuis l'onglet SMTP Settings de Mailtrap |
| `ECONNREFUSED` ou timeout | Port 2525 bloqué (réseau entreprise) | Essayer `SMTP_PORT=587` |
| Lien dans le mail → page blanche | `BACKOFFICE_URL` incorrect | Vérifier `BACKOFFICE_URL=http://localhost:5173` dans `.env` |

---

## 9. Lancer les tests automatisés

### Tests backend (Jest)
```bash
cd packages/api
npm test              # tous les tests
npm run test:cov      # avec couverture de code
```
> Note : 8 fichiers `.spec.ts` ont des erreurs de typage dans les mocks (propriétés manquantes
> après des ajouts d'entités). Les tests eux-mêmes peuvent passer, mais TypeScript se plaint.
> À corriger avant de livrer.

### Tests backoffice (Vitest)
```bash
cd apps/backoffice
npm test              # one-shot
npm run test:watch    # mode watch (relance à chaque sauvegarde)
```

### Tests admin
Aucun test configuré pour le moment.

### Compilation TypeScript (vérification sans exécuter)
```bash
# Backend
cd packages/api && npx tsc --noEmit

# Backoffice
cd apps/backoffice && npx tsc --noEmit

# Admin
cd apps/admin && npx tsc --noEmit

# Mobile
cd apps/mobile && npx tsc --noEmit
```

---

## 10. Problèmes fréquents et solutions

### Port 3000 déjà utilisé
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution :
```bash
lsof -ti :3000 | xargs kill -9
```

### Docker ne répond pas
Symptôme : `Cannot connect to the Docker daemon`
Solution : ouvre Docker Desktop et attends que l'icône soit stable.

### Le PostgreSQL natif Homebrew démarre au lieu de Docker
Si tu as `postgresql@16` installé via Homebrew et qu'il démarre automatiquement,
il prend le port 5432 avant Docker.
```bash
brew services stop postgresql@16
```
Puis relance `docker-compose up -d`.

> Pour éviter que Homebrew redémarre automatiquement au boot :
> `brew services disable postgresql@16`

### `npm run start:dev -w packages/api` ne fonctionne pas
Le workspace npm utilise le **nom** du package, pas son chemin.
```bash
npm run start:dev -w api    # ✅ correct (name dans package.json = "api")
# ou
cd packages/api && npm run start:dev
```

### Le mobile ne contacte pas l'API
- Vérifie que le backend tourne (`http://localhost:3000/`)
- Sur simulateur iOS : `localhost` fonctionne
- Sur émulateur Android : l'URL est automatiquement `http://10.0.2.2:3000`
- Sur vrai appareil : ton téléphone et ton Mac doivent être sur le **même réseau Wi-Fi**.
  Remplace `localhost` par l'IP locale de ton Mac (ex : `192.168.1.42`) dans
  `apps/mobile/src/constants/api.constants.ts`

### Erreurs CORS sur l'admin
Le backend n'autorise que `http://localhost:5173`. Si l'admin tourne sur `5174` :
1. Ouvre `packages/api/.env`
2. Ajoute : `CORS_ORIGIN=http://localhost:5174`
3. Redémarre le backend

---

## 11. Démo — Validation AR avec QR code (US12)

### Ce que fait la fonctionnalité

Le joueur scanne un QR code physique (collé sur un mur, une vitrine, une œuvre) →
l'app révèle un **overlay 2D en réalité augmentée** sur la caméra →
le joueur confirme qu'il le voit → l'étape est validée côté serveur.

### Prérequis pour la démo

- Backend lancé (`npm run start:dev -w packages/api`)
- Docker lancé (MinIO sur port 9000 pour les images AR)
- App mobile lancée en mode LAN (`npx expo start --lan` depuis `apps/mobile/`)
- Téléphone et Mac sur le **même réseau Wi-Fi**
- Fichier `apps/mobile/.env.local` présent avec :
  ```
  EXPO_PUBLIC_API_URL=http://<IP_MAC>:3000
  ```
  (Remplace `<IP_MAC>` par l'IP de ton Mac sur le réseau local — `ifconfig | grep "inet 192"`)

### Chasse de démo préparée

Une chasse de test avec une étape AR est déjà créée en base :
- **Chasse** : "Test RA QR"
- **Étape** : "Trouvez le QR code caché"
- **QR trigger** : `LOOTOPIA-AR-2026`
- **Overlay** : `http://<IP_MAC>:9000/lootopia/ar/ar_treasure.png`

> Si la BDD a été reseedée, recrée l'étape avec ce curl (remplace `<TOKEN_PARTNER>` par un token `musee@lootopia.fr`) :
> ```bash
> curl -X POST http://localhost:3000/hunts/<HUNT_ID>/steps \
>   -H "Authorization: Bearer <TOKEN_PARTNER>" \
>   -H "Content-Type: application/json" \
>   -d '{
>     "title": "Trouvez le QR code caché",
>     "description": "Scannez le QR code pour révéler le contenu AR.",
>     "order": 0,
>     "validation_type": "ar",
>     "validation_radius": 50,
>     "ar_content": {
>       "type": "qr-overlay",
>       "qr_trigger": "LOOTOPIA-AR-2026",
>       "image": "http://<IP_MAC>:9000/lootopia/ar/ar_treasure.png"
>     }
>   }'
> ```

### QR code à afficher

Génère le QR code `LOOTOPIA-AR-2026` :
```bash
pip3 install qrcode pillow --break-system-packages -q
python3 -c "
import qrcode
qr = qrcode.QRCode(version=1, box_size=12, border=5)
qr.add_data('LOOTOPIA-AR-2026')
qr.make(fit=True)
qr.make_image().save('/tmp/ar_qr.png')
"
open /tmp/ar_qr.png   # s'ouvre dans Preview — affiche-le sur ton écran ou imprime-le
```

### Scénario de démo pas à pas

| Étape | Action | Ce que le jury voit |
|---|---|---|
| 1 | Ouvre l'app sur le téléphone | Écran carte avec les chasses disponibles |
| 2 | Onglet **Chasses** → cherche "Test RA QR" | Liste filtrée |
| 3 | Clique sur la chasse → bouton **Rejoindre** | Confirmation d'inscription |
| 4 | Clique sur l'étape **"Trouvez le QR code caché"** → **Démarrer** | Badge **🔮 Validation par RA** + caméra avec cadre de scan |
| 5 | Pointe la caméra vers le QR code affiché sur ton Mac | Scan automatique |
| 6 | QR reconnu → overlay "Trésor découvert" apparaît sur la caméra | Image AR superposée au flux caméra |
| 7 | Appuie sur **"Je le vois — Valider"** | Validation envoyée au serveur → succès → retour carte |

### Points à souligner pendant la démo

- Le QR code est le **déclencheur physique** — sans le bon code, l'overlay n'apparaît pas
- Le serveur **vérifie le code** (`qr_trigger`) — impossible de tricher avec n'importe quel QR
- L'overlay est **configurable** : n'importe quelle image uploadée via le backoffice
- Le type `2d-overlay` existe aussi : affiche directement l'overlay sans scan préalable

---

## 12. Architecture RA — US12 vs US63 (futur)

### US12 (implémenté) — RA 2D avec QR déclencheur

| Élément | Valeur |
|---|---|
| Branche | `feature/US12-ar-qr-overlay` |
| `ar_content.type` | `'2d-overlay'` ou `'qr-overlay'` |
| Technologie | `expo-camera` CameraView + Image React Native |
| Composant | `apps/mobile/src/components/step/ARSection.tsx` |
| Types partagés | `ArContent2DOverlay`, `ArContentQROverlay` dans `packages/shared/src/types/step.types.ts` |

### US63 (futur) — RA spatiale 3D (ViroARImageMarker)

| Élément | Valeur |
|---|---|
| Objectif | Détecter une image physique et ancrer un objet 3D dans l'espace réel |
| Technologie | `@reactvision/react-viro` — `ViroARImageMarker` + `ViroNode` |
| Nouveau type | `ar_content.type: '3d-spatial'` + champs `marker_image`, `model_url` |
| Bloquant | react-viro 2.53.1 cible RN ~0.81.4 ; projet sur RN 0.83.2 |

### Pourquoi US63 n'interferera pas avec US12

Le code US12 est architecturé pour être **extensible sans casser l'existant** :

```
ARSection.tsx
  ├── if type === '2d-overlay'  → OverlayPhase (caméra + image)        ← US12
  ├── if type === 'qr-overlay'  → QRScanPhase → OverlayPhase           ← US12
  └── if type === '3d-spatial'  → ViroARPhase (à ajouter dans US63)    ← US63
```

US63 se limitera à :
1. Ajouter `ArContent3DSpatial` au type union dans `shared/src/types/step.types.ts`
2. Ajouter un `else if` dans `ARSection.tsx` pour le nouveau cas
3. Créer le composant `ViroARPhase` séparément

**Aucune modification** des cas `2d-overlay` et `qr-overlay` existants.
La branche US63 naîtra de `develop` après merge de US12 → zéro conflit structurel.

---

## 13. Écrire des prompts efficaces pour Claude Code

### Pourquoi c'est important
Claude Code facture par token (unité de texte traité). Un mauvais prompt force Claude à
lire tout le projet pour trouver lui-même le contexte → lent et coûteux.
Un bon prompt donne le contexte directement → réponse rapide et précise.

---

### Les 4 règles d'or

**Règle 1 — Donne le fichier exact, pas le module**
```
❌ "Corrige le bug dans le module auth"
✅ "Corrige le bug dans packages/api/src/modules/auth/auth.service.ts
    à la ligne 45, la méthode validateUser ne gère pas le cas où
    l'utilisateur est un invité (is_guest = true)"
```

**Règle 2 — Décris le comportement attendu ET le comportement actuel**
```
❌ "L'écran de profil ne marche pas"
✅ "apps/mobile/src/screens/profile/ProfileScreen.tsx
    Comportement actuel : affiche 'undefined' pour le pseudo
    Comportement attendu : affiche le pseudo de l'utilisateur connecté
    Le pseudo vient de GET /me/profile → champ 'pseudo'"
```

**Règle 3 — Indique la portée (ce qu'il ne faut PAS toucher)**
```
✅ "Modifie uniquement apps/backoffice/src/pages/HuntsPage.tsx.
    Ne touche pas aux services ni aux stores."
```

**Règle 4 — Pour les nouvelles fonctionnalités, fournis le contrat**
```
✅ "Implémente US03 — Inscription partenaire dans le backoffice.
    - Fichier à modifier : apps/backoffice/src/pages/LoginPage.tsx
    - Ajoute un onglet 'Créer un compte' à côté de 'Se connecter'
    - Formulaire : email, password, confirm password
    - Appelle POST /auth/register avec { email, password, role: 'PARTNER' }
    - L'endpoint existe déjà côté API, ne le modifie pas"
```

---

### Templates de prompts par type de tâche

#### Audit d'un fichier
```
Audite [CHEMIN_FICHIER].
Dis-moi :
1. Ce que ce fichier fait réellement
2. Ce qui est cassé ou manquant par rapport à [US / comportement attendu]
3. Les dépendances impactées si on le modifie
Ne génère aucun code, lecture seule.
```

#### Bug fix
```
Fichier : [CHEMIN]
Ligne : [N]
Symptôme : [ce qui se passe]
Attendu : [ce qui devrait se passer]
Contexte : [la fonction / le flux concerné]
Contrainte : ne modifie que ce fichier.
```

#### Nouvelle fonctionnalité (US)
```
Implémente [US_NOM] dans [APP].

Fichiers à créer/modifier :
- [fichier1] → [ce qu'il doit faire]
- [fichier2] → [ce qu'il doit faire]

Contrat API (endpoint existant) :
- Méthode + URL
- Body attendu
- Réponse

Ne touche pas à : [liste des fichiers hors scope]
Après implémentation : lance npx tsc --noEmit pour vérifier les types.
```

#### Correction des tests
```
Les tests dans [CHEMIN_SPEC] échouent avec cette erreur :
[COLLER L'ERREUR EXACTE]

L'entité concernée est [CHEMIN_ENTITY].
Les propriétés manquantes dans les mocks sont : [liste].
Mets à jour uniquement les objets mock dans ce fichier spec, 
sans modifier la logique des tests ni les assertions.
```

---

### Prompts à éviter

| Prompt dangereux | Pourquoi | Version corrigée |
|---|---|---|
| "Refactorise tout le module auth" | Scope incontrôlable, risque de tout casser | "Extrais la méthode X dans un helper dans [fichier]" |
| "Fais en sorte que ça marche" | Claude va improviser | Décris le symptôme exact |
| "Améliore le code" | Subjectif, modifications imprévisibles | "Corrige uniquement l'erreur TypeScript ligne 45" |
| "Regarde tout le projet et dis-moi..." | Consomme tous les tokens | "Lis [3 fichiers max] et dis-moi..." |
| "Continue ce que tu faisais" | Claude n'a pas de mémoire entre sessions | Fournis toujours le contexte complet |

---

### Prompt de reprise de session (à copier-coller)

Quand tu reprends une session après une pause, colle ça en début de conversation :

```
Projet : LootopiaV3 — monorepo NestJS + React Native + Expo + React (Vite)
Chemin : /Users/thomas/Documents/SDV/projet_etude/lootopiaV3

Contexte de la session :
- Backend tourne sur :3000 (npm run start:dev dans packages/api)
- Docker tourne (postgres + minio)
- Dernière chose faite : [REMPLIS ICI]
- Prochain objectif : [REMPLIS ICI]

Stack impliquée : [ex: mobile uniquement / backoffice + API]
Fichiers concernés : [liste si tu les connais]
```

---

### Estimer le coût d'un prompt

Règle approximative :
- Lire 1 fichier de ~100 lignes ≈ 1 000 tokens
- Lire le projet entier ≈ 50 000-100 000 tokens
- Générer 100 lignes de code ≈ 2 000 tokens

Sur l'abonnement Pro Claude (20€/mois) les limites se réinitialisent régulièrement.
Pour les grosses tâches (audits complets, implémentation de 5 fichiers+), préfère
démarrer une nouvelle conversation par tâche plutôt que tout dans une seule session.

---

### Ordre recommandé pour les prochaines US à implémenter

Priorité haute :
1. ~~**US03** — Inscription partenaire~~ ✅ Flux invitation complet + emails Mailtrap (2026-05-28)
2. ~~**US12** — Validation AR avec QR code~~ ✅ ARSection qr-overlay + 2d-overlay (2026-06-02)
3. **US55/56/57** — Compléter le backoffice : `StepForm` doit exposer `validation_type` + champs dynamiques (code QR, réponse quiz, ar_content)

Priorité moyenne :
4. Corriger les mocks `.spec.ts` cassés (backend, tests)
5. **US63** — RA spatiale 3D (`ViroARImageMarker`) — nécessite compatibilité react-viro 2.53+ avec RN 0.83
6. **US15** — Multilangue (toutes les apps, nécessite i18next)

---

*Guide maintenu manuellement — mets à jour la section "Dernière modification" quand tu ajoutes un bloc.*
