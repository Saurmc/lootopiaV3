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

> Guide autonome : tout ce qu'il faut pour reproduire la démo de A à Z, y compris en présentation.

### Ce que montre la fonctionnalité

Le joueur scanne un QR code physique (affiché sur un écran, imprimé, collé sur une vitrine) →
l'app reconnaît le code, **révèle un overlay en réalité augmentée** superposé au flux caméra →
le joueur confirme qu'il voit le contenu → **l'étape est validée côté serveur** (le serveur vérifie que le bon QR a été scanné).

---

### ÉTAPE 0 — Trouver l'IP du Mac sur le réseau local

Le téléphone et le Mac doivent être sur le **même Wi-Fi**. L'IP change selon le réseau.

```bash
ifconfig | grep "inet 192"
# Exemple de sortie : inet 192.168.1.14 netmask 0xffffff00 broadcast 192.168.1.255
# → ton IP est 192.168.1.14
```

> En présentation sur un réseau inconnu, relance cette commande dès que tu es connecté au Wi-Fi de la salle.

---

### ÉTAPE 1 — Configurer le fichier `.env.local` du mobile

Fichier : `apps/mobile/.env.local` (ignoré par git, à créer si absent)

```bash
# Remplace 192.168.1.14 par l'IP trouvée à l'étape 0
echo "EXPO_PUBLIC_API_URL=http://192.168.1.14:3000" > apps/mobile/.env.local
```

Ce fichier est lu automatiquement par Expo. **Relance `npx expo start` après toute modification.**

---

### ÉTAPE 2 — Démarrer l'environnement

Ouvre **4 terminaux** (ou onglets) :

```bash
# Terminal 1 — Docker (base de données + MinIO images AR)
docker-compose up -d

# Terminal 2 — Backend API
cd packages/api && npm run start:dev
# Attends : "Nest application successfully started"

# Terminal 3 — App mobile (mode LAN = accessible depuis le téléphone)
cd apps/mobile && npx expo start --lan
# Expo affiche un QR code pour Expo Go OU une URL Metro

# Terminal 4 — (optionnel) Backoffice partenaire
cd apps/backoffice && npm run dev
# Accessible sur http://localhost:5173
```

> **Vrai appareil iOS** : installe l'app via Xcode (`npx expo run:ios --device`) ou Expo Go.
> L'app doit être construite avec la même IP que `.env.local`.

---

### ÉTAPE 3 — Vérifier que la chasse de démo existe

La chasse "Test RA QR" a été créée manuellement (elle n'est **pas** dans le seed).
**Elle disparaît si la BDD est reseedée** (`npm run seed`).

```bash
# Vérifie que la chasse existe
curl -s http://localhost:3000/hunts | python3 -c "
import sys, json
hunts = json.load(sys.stdin)
ar = [h for h in hunts if h.get('title') == 'Test RA QR']
print('Chasse trouvée :', ar[0]['id'] if ar else 'INTROUVABLE — recrée-la (voir ci-dessous)')
"
```

**Si la chasse est introuvable**, recrée-la entièrement :

```bash
# 1. Obtenir un token partenaire
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"musee@lootopia.fr","password":"Partner123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Créer la chasse (remplace 192.168.1.14 par ton IP)
HUNT_ID=$(curl -s -X POST http://localhost:3000/hunts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test RA QR","description":"Chasse démo AR","difficulty":"easy","points":100,"is_active":true,"lat":48.8534,"lng":2.3488}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Hunt ID : $HUNT_ID"

# 3. Uploader l'image overlay sur MinIO (si elle n'existe pas déjà)
python3 << 'PYEOF'
import boto3
from botocore.client import Config
from PIL import Image, ImageDraw, ImageFont
import math, io

W, H = 600, 600
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
for i in range(H):
    alpha = int(230 * (1 - i / H * 0.3))
    r, g, b = int(210 - i*0.15), int(160 - i*0.12), int(80 - i*0.05)
    draw.line([(0,i),(W,i)], fill=(r,g,b,alpha))
for t in range(8):
    draw.rectangle([t,t,W-1-t,H-1-t], outline=(255,215-t*5,0,255-t*20))
cx, cy = W//2, H//2-40
pts = []
for i in range(10):
    a = math.radians(i*36-90)
    r2 = 120 if i%2==0 else 55
    pts.append((cx+r2*math.cos(a), cy+r2*math.sin(a)))
draw.polygon(pts, fill=(255,220,0,230), outline=(200,140,0,255))
draw.ellipse([cx-20,cy-20,cx+20,cy+20], fill=(200,40,40,255))
draw.line([cx-30,cy,cx+30,cy], fill=(255,255,255,255), width=5)
draw.line([cx,cy-30,cx,cy+30], fill=(255,255,255,255), width=5)
try:
    fb = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 52)
    fs = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
except:
    fb = fs = ImageFont.load_default()
draw.text((W//2+2,H-140+2), "LOOTOPIA", font=fb, fill=(0,0,0,180), anchor="mm")
draw.text((W//2,H-140), "LOOTOPIA", font=fb, fill=(255,220,0,255), anchor="mm")
draw.text((W//2,H-90), "Tresor decouvert", font=fs, fill=(255,255,255,230), anchor="mm")
buf = io.BytesIO()
img.save(buf, "PNG")
buf.seek(0)
s3 = boto3.client('s3', endpoint_url='http://localhost:9000',
    aws_access_key_id='minioadmin', aws_secret_access_key='minioadmin123',
    config=Config(signature_version='s3v4'), region_name='us-east-1')
s3.upload_fileobj(buf, 'lootopia', 'ar/ar_treasure.png', ExtraArgs={'ContentType':'image/png'})
print("Image uploadée sur MinIO")
PYEOF

# 4. Créer l'étape AR (remplace HUNT_ID et 192.168.1.14)
curl -s -X POST "http://localhost:3000/hunts/$HUNT_ID/steps" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Trouvez le QR code caché\",
    \"description\": \"Scannez le QR code dissimulé pour révéler le contenu AR.\",
    \"order\": 0,
    \"validation_type\": \"ar\",
    \"validation_radius\": 50,
    \"ar_content\": {
      \"type\": \"qr-overlay\",
      \"qr_trigger\": \"LOOTOPIA-AR-2026\",
      \"image\": \"http://192.168.1.14:9000/lootopia/ar/ar_treasure.png\"
    }
  }" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Step créé :', d.get('id','ERREUR: '+str(d)))"
```

> **Note IP** : si ton IP a changé (réseau de présentation différent), mets à jour le champ `image` de l'étape avec un PATCH :
> ```bash
> curl -X PATCH "http://localhost:3000/hunts/<HUNT_ID>/steps/<STEP_ID>" \
>   -H "Authorization: Bearer $TOKEN" \
>   -H "Content-Type: application/json" \
>   -d '{"ar_content":{"type":"qr-overlay","qr_trigger":"LOOTOPIA-AR-2026","image":"http://<NOUVELLE_IP>:9000/lootopia/ar/ar_treasure.png"}}'
> ```

---

### ÉTAPE 4 — Générer et afficher le QR code

```bash
# Installe les dépendances une fois (si pas déjà fait)
pip3 install qrcode pillow --break-system-packages -q

# Génère le QR code et ouvre-le dans Preview
python3 -c "
import qrcode
qr = qrcode.QRCode(version=1, box_size=14, border=5)
qr.add_data('LOOTOPIA-AR-2026')
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save('/tmp/ar_qr.png')
print('QR généré : /tmp/ar_qr.png')
" && open /tmp/ar_qr.png
```

**En présentation** : mets Preview en plein écran sur ton Mac — le téléphone le scannera directement depuis l'écran. Ou imprime-le en A5 minimum pour une meilleure lisibilité.

---

### ÉTAPE 5 — Réinitialiser la progression (si déjà jouée)

Si la chasse a déjà été validée, supprime la progression du joueur de test :

```bash
# Remplace l'email si besoin (compte de démo)
docker exec lootopia_postgres psql -U lootopia -d lootopia -c "
DELETE FROM progress
WHERE hunt_id = (SELECT id FROM hunts WHERE title = 'Test RA QR')
  AND user_id = (SELECT id FROM users WHERE email = 'alice@example.com');
"
```

Puis dans l'app : secoue le téléphone → **Reload** (ou Cmd+R sur simulateur).

---

### ÉTAPE 6 — Scénario de présentation

| # | Ce que tu fais | Ce que le jury voit |
|---|---|---|
| 1 | Ouvre l'app mobile sur le téléphone | Carte interactive avec marqueurs de chasses |
| 2 | Onglet **Chasses** → tape "Test RA" dans la recherche | Liste filtrée en temps réel |
| 3 | Sélectionne **"Test RA QR"** → **Rejoindre la chasse** | Confirmation + liste des étapes |
| 4 | Clique sur **"Trouvez le QR code caché"** → **Démarrer** | Badge **🔮 Validation par RA** + caméra activée + cadre de scan animé |
| 5 | Pointe la caméra vers le QR code affiché sur ton Mac/imprimé | Lecture automatique du QR en moins d'une seconde |
| 6 | QR reconnu → overlay "Trésor découvert" s'affiche | Image dorée superposée au flux caméra en temps réel |
| 7 | Appuie sur **"Je le vois — Valider"** | Requête serveur → succès → écran de complétion avec points |

**Points clés à expliquer au jury :**
- Le QR code est le **déclencheur physique** — sans le bon code, l'overlay ne s'affiche pas
- Le serveur **vérifie cryptographiquement** le code (`qr_trigger` stocké côté API) — impossible de tricher
- L'image overlay est **hébergée sur MinIO** (notre S3 local) et configurable par le partenaire via le backoffice
- Architecture **extensible** : le type `2d-overlay` affiche directement l'overlay sans scan ; `3d-spatial` sera ajouté en US63

---

### Dépannage démo AR

| Symptôme | Cause | Solution |
|---|---|---|
| L'app ne contacte pas l'API | Mauvaise IP dans `.env.local` | `ifconfig \| grep "inet 192"` → mettre à jour `.env.local` → relancer Expo |
| L'overlay AR ne s'affiche pas (image cassée) | MinIO inaccessible ou IP changée | Vérifier `docker ps` → mettre à jour l'URL image dans l'étape (voir ÉTAPE 3) |
| QR scanné mais rien ne se passe | QR imprimé trop petit / mal éclairé | Agrandir dans Preview (Cmd+Maj+F = plein écran) ou rapprocher |
| "QR code incorrect" affiché | QR contient un mauvais contenu | Regénérer avec le script ÉTAPE 4 — vérifier que le contenu est exactement `LOOTOPIA-AR-2026` |
| La chasse s'affiche "terminée" | Progression non réinitialisée | Voir ÉTAPE 5 — supprimer la progression en base |
| Caméra noire sur simulateur iOS | Le simulateur n'a pas de caméra | Tester obligatoirement sur **vrai appareil** pour la caméra AR |

---

## 12. Architecture RA — US12 (fait) vs US63 (futur)

### US12 — RA 2D déclenchée par QR ✅

| Élément | Détail |
|---|---|
| Branche | `feature/US12-ar-qr-overlay` |
| `ar_content.type` supportés | `'2d-overlay'` (overlay immédiat) · `'qr-overlay'` (scan QR → overlay) |
| Technologie | `expo-camera` `CameraView` + `Image` React Native superposée |
| Composant mobile | `apps/mobile/src/components/step/ARSection.tsx` |
| Validation serveur | `progress.service.ts` → `validateAr()` vérifie `qr_trigger` |
| Types partagés | `ArContent2DOverlay`, `ArContentQROverlay` dans `packages/shared/src/types/step.types.ts` |

### US63 — RA spatiale 3D ❌ (non implémentée)

| Élément | Détail |
|---|---|
| Objectif | Détecter une image physique réelle et ancrer un objet 3D dans l'espace |
| Technologie visée | `@reactvision/react-viro` → `ViroARImageMarker` + `ViroNode` |
| Nouveau `ar_content.type` | `'3d-spatial'` avec champs `marker_image` (URL image déclencheur) et `model_url` (fichier 3D) |
| Blocage actuel | `react-viro 2.53.1` cible RN `~0.81.4` ; ce projet est sur RN `0.83.2` — migration ou fork nécessaire |
| Branche future | `feature/US63-ar-3d-spatial` (à créer depuis `develop` **après** merge de US12) |

### Pourquoi US63 ne cassera pas US12

Le composant `ARSection.tsx` est une cascade `if/else if` par type :

```
ARSection.tsx
  ├── arContent.type === '2d-overlay'   → OverlayPhase directement       ← US12 ✅
  ├── arContent.type === 'qr-overlay'   → QRScanPhase → OverlayPhase     ← US12 ✅
  └── arContent.type === '3d-spatial'   → ViroARPhase  (à ajouter)       ← US63 ❌
```

US63 se limitera à trois ajouts isolés :
1. `ArContent3DSpatial` dans le type union de `step.types.ts`
2. Un `else if` dans `ARSection.tsx` pour router vers `ViroARPhase`
3. Un nouveau composant `ViroARPhase.tsx`

**Aucun code US12 ne sera modifié.** Les branches naissent de `develop` post-merge — zéro conflit structurel garanti.

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
