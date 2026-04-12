# User Stories — Application Mobile Lootopia

---

## US47 — Connexion et inscription

**En tant que** nouvel utilisateur,  
**Je veux** me connecter ou créer un compte depuis l'écran d'authentification,  
**Afin d'** accéder à l'application avec une identité persistante.

**Critères d'acceptation :**
- L'écran propose deux onglets : "Se connecter" et "Créer un compte".
- Connexion : formulaire email + mot de passe, appel `POST /auth/login`, JWT stocké en SecureStorage.
- Inscription : formulaire email + mot de passe + confirmation, appel `POST /auth/register`.
- Les erreurs API (mauvais identifiants, email déjà utilisé) sont affichées sous le champ concerné.
- Après succès, l'utilisateur est redirigé vers l'écran d'accueil (carte).

---

## US48 — Mode invité (guest login)

**En tant que** utilisateur ne souhaitant pas créer de compte,  
**Je veux** accéder à l'application en mode invité sans m'inscrire,  
**Afin de** jouer immédiatement sans engagement.

**Critères d'acceptation :**
- Un bouton "Continuer en invité" est affiché sur l'écran d'authentification.
- Un UUID `device_token` est généré côté client et stocké en SecureStorage s'il n'existe pas déjà.
- L'appel `POST /auth/guest` renvoie un JWT 365 jours, stocké comme pour un compte normal.
- Immédiatement après, une popup demande le consentement GPS ("Autoriser la localisation pour trouver les chasses près de vous ?").
- Une bannière persistante sur l'accueil rappelle que la progression peut être perdue et invite à créer un compte.

---

## US49 — Conversion d'un compte invité en compte réel

**En tant que** joueur invité ayant accumulé de la progression,  
**Je veux** convertir mon compte invité en compte réel avec email et mot de passe,  
**Afin de** sauvegarder définitivement ma progression sans la perdre.

**Critères d'acceptation :**
- Un formulaire email + mot de passe + confirmation est accessible depuis le profil invité.
- L'appel `PATCH /auth/convert` est effectué avec le JWT invité courant.
- En cas de succès, le même `user_id` est conservé (toute la progression est préservée) et un nouveau JWT est émis.
- En cas d'email déjà utilisé, un message d'erreur clair est affiché.
- Après conversion, la bannière "mode invité" disparaît.

---

## US50 — Carte interactive avec position de l'utilisateur

**En tant que** joueur (connecté ou invité),  
**Je veux** voir une carte interactive centrée sur ma position GPS,  
**Afin de** m'orienter géographiquement dans l'application.

**Critères d'acceptation :**
- La carte s'affiche en écran d'accueil au lancement de l'application.
- Si le consentement GPS est accordé, la carte est centrée sur la position de l'utilisateur avec un marqueur "moi".
- Si le consentement GPS est refusé ou absent, la carte s'affiche sur une position par défaut (Paris ou dernière position connue).
- Un bouton "Recentrer" repositionne la carte sur la position courante.
- Un bouton "Liste" bascule vers la vue liste (US52).

---

## US51 — Affichage des chasses sur la carte

**En tant que** joueur sur la carte d'accueil,  
**Je veux** voir les chasses disponibles représentées par des marqueurs,  
**Afin de** repérer visuellement les chasses autour de moi.

**Critères d'acceptation :**
- Les chasses actives sont récupérées via `GET /hunts?lat=&lng=&radius=` (ou `GET /hunts` en fallback).
- Chaque chasse est représentée par un marqueur positionné à ses coordonnées GPS.
- Le marqueur affiche la difficulté via une couleur ou icône (facile = vert, moyen = orange, difficile = rouge).
- Les chasses déjà complétées par l'utilisateur ont un marqueur visuellement distinct (grisé + coche).
- Tapper un marqueur ouvre une bottom sheet avec : titre, description courte, difficulté, distance, bouton "Rejoindre".

---

## US52 — Vue liste des chasses avec tri et filtres

**En tant que** joueur souhaitant parcourir les chasses disponibles,  
**Je veux** consulter la liste des chasses avec possibilité de trier et filtrer,  
**Afin de** trouver une chasse adaptée à mes envies.

**Critères d'acceptation :**
- La liste affiche les chasses avec : titre, localisation, difficulté (badge coloré), durée, points, distance.
- Par défaut, la liste est triée par distance croissante (si GPS disponible) ou par titre.
- Des filtres permettent de restreindre par difficulté (facile / moyen / difficile).
- Une barre de recherche filtre les chasses par nom via `GET /hunts?q=`.
- Tapper une chasse ouvre sa fiche détail avec un bouton "Rejoindre".

---

## US53 — Rejoindre une chasse et consulter ses étapes

**En tant que** joueur souhaitant démarrer une chasse,  
**Je veux** rejoindre une chasse et voir la liste de ses étapes avec leur statut,  
**Afin de** savoir où j'en suis dans ma progression.

**Critères d'acceptation :**
- Le bouton "Rejoindre" appelle `POST /hunts/:id/join` et crée une entrée de progression.
- Si l'utilisateur a déjà rejoint la chasse, le bouton devient "Continuer" et ne re-crée pas de progression.
- L'écran de la chasse affiche la liste des étapes avec leur ordre, leur titre et leur statut (à faire / en cours / validée).
- L'étape en cours est mise en évidence et un bouton "Commencer l'étape" permet d'y accéder.
- La progression globale (ex : "2 / 5 étapes") est affichée en haut de l'écran.

---

## US54 — Validation d'étape par géolocalisation GPS

**En tant que** joueur sur une étape de type "géolocalisation",  
**Je veux** que mon étape soit validée automatiquement lorsque je suis physiquement à proximité du point cible,  
**Afin de** progresser dans la chasse sans action manuelle.

**Critères d'acceptation :**
- L'écran de l'étape affiche les indices et une mini-carte indiquant la direction générale (sans révéler l'emplacement exact).
- Un bouton "Vérifier ma position" appelle `POST /hunts/:id/steps/:stepId/validate` avec les coordonnées GPS courantes.
- Si la distance est dans le rayon de validation, l'étape est validée et une animation de succès s'affiche.
- Si la distance est insuffisante, un message indique que l'utilisateur est trop loin, sans révéler la distance exacte.
- En cas d'absence de consentement GPS, un message invite l'utilisateur à autoriser la localisation.

---

## US55 — Validation d'étape par QR Code

**En tant que** joueur sur une étape de type "QR Code",  
**Je veux** scanner un QR Code physique pour valider l'étape,  
**Afin de** prouver ma présence à l'endroit indiqué.

**Critères d'acceptation :**
- L'écran de l'étape affiche les indices et un bouton "Scanner le QR Code" qui ouvre la caméra.
- Le scan décode le contenu du QR Code et l'envoie à `POST /hunts/:id/steps/:stepId/validate`.
- Si le code correspond à l'étape attendue, l'étape est validée avec une animation de succès.
- En cas de mauvais QR Code, un message d'erreur est affiché et l'utilisateur peut réessayer.
- La caméra est fermée automatiquement après un scan réussi.

---

## US56 — Validation d'étape par Quiz

**En tant que** joueur sur une étape de type "quiz",  
**Je veux** répondre à une question pour valider l'étape,  
**Afin de** tester mes connaissances sur le lieu ou le thème de la chasse.

**Critères d'acceptation :**
- L'écran affiche la question et, selon la configuration, soit un champ texte libre soit une liste de choix multiples.
- La réponse est soumise via `POST /hunts/:id/steps/:stepId/validate`.
- En cas de bonne réponse, l'étape est validée avec une animation de succès.
- En cas de mauvaise réponse, un feedback est affiché et l'utilisateur peut réessayer.
- Le nombre de tentatives restantes est affiché si une limite est configurée.

---

## US57 — Validation d'étape par photo

**En tant que** joueur sur une étape de type "photo",  
**Je veux** prendre une photo correspondant à l'indice donné pour valider l'étape,  
**Afin de** prouver que j'ai trouvé l'élément demandé.

**Critères d'acceptation :**
- L'écran affiche l'indice descriptif (ex : "Photographiez la plaque historique") et un bouton "Prendre une photo".
- La photo est capturée via la caméra de l'appareil ou sélectionnée depuis la galerie.
- La photo est uploadée et la validation est effectuée via `POST /hunts/:id/steps/:stepId/validate`.
- Un aperçu de la photo est affiché avant soumission avec possibilité de recommencer.
- Après soumission, l'étape passe en statut "en attente de validation" si une validation manuelle est requise, ou est validée immédiatement.

---

## US58 — Récapitulatif de fin de chasse et récompenses

**En tant que** joueur ayant validé la dernière étape d'une chasse,  
**Je veux** voir un écran de récapitulatif avec mes performances et les récompenses obtenues,  
**Afin de** connaître mon score et les badges débloqués.

**Critères d'acceptation :**
- L'écran s'affiche automatiquement après validation de la dernière étape.
- Les statistiques affichées sont : temps total, points obtenus, nombre d'étapes complétées.
- Les badges nouvellement débloqués sont listés avec leur illustration et leur nom.
- Une animation de célébration (confettis ou équivalent) est jouée à l'ouverture.
- Un bouton "Retour à la carte" ramène à l'accueil (US50).
- Un bouton "Partager" permet de partager le résultat (texte généré ou screenshot).

---

## US59 — Page de profil joueur (niveau et progression)

**En tant que** joueur connecté,  
**Je veux** consulter mon profil avec mon niveau, mon titre et mes points,  
**Afin de** suivre ma progression globale dans l'application.

**Critères d'acceptation :**
- Le profil affiche : photo de profil (ou avatar par défaut), pseudo, titre actuel, niveau et barre de progression vers le niveau suivant.
- Le total de points cumulés est affiché en évidence.
- Les données sont récupérées via `GET /me/profile`.
- Pour les joueurs invités, un encart "Créer un compte" remplace les informations manquantes avec un bouton vers US49.
- Un bouton "Paramètres" redirige vers US61.

---

## US60 — Collection de badges et historique des chasses

**En tant que** joueur connecté,  
**Je veux** consulter mes badges débloqués et l'historique de mes chasses complétées,  
**Afin de** voir l'ensemble de mes accomplissements.

**Critères d'acceptation :**
- Une section "Badges" affiche tous les badges en grille : débloqués en couleur, non débloqués en grisé avec leur condition visible.
- Une section "Chasses complétées" liste les chasses terminées avec titre, date et points obtenus.
- Les données sont récupérées via `GET /me/badges` et `GET /me/progress` (ou équivalents).
- Un tap sur un badge affiche une modale avec sa description complète.

---

## US61 — Modification du profil et consentement GPS

**En tant que** joueur connecté,  
**Je veux** modifier ma photo de profil, mon pseudo et mon consentement GPS,  
**Afin de** personnaliser mon compte et contrôler mes données de localisation.

**Critères d'acceptation :**
- Un formulaire permet de modifier le pseudo et la photo de profil (galerie ou caméra).
- Les modifications sont sauvegardées via `PATCH /me/profile`.
- Un toggle "Consentement localisation" permet d'activer ou désactiver le GPS, avec un message expliquant l'impact sur le gameplay.
- Les changements sont reflétés immédiatement sur la page de profil (US59).
- Les erreurs de validation sont affichées inline sous chaque champ.

---

## US62 — Sécurité du compte et suppression

**En tant que** joueur connecté,  
**Je veux** pouvoir modifier mon mot de passe, me déconnecter ou supprimer mon compte,  
**Afin de** gérer la sécurité de mon compte.

**Critères d'acceptation :**
- Un formulaire "Changer le mot de passe" requiert : mot de passe actuel, nouveau mot de passe, confirmation ; appel `PATCH /me/password`.
- Un bouton "Se déconnecter" supprime le JWT du SecureStorage et redirige vers US47.
- Un bouton "Supprimer le compte" demande une confirmation textuelle ("SUPPRIMER") avant d'appeler `DELETE /me`.
- Après suppression, l'utilisateur est redirigé vers l'écran d'authentification.
- Cette section n'est pas accessible aux joueurs invités (ils voient uniquement le bouton de conversion US49).
