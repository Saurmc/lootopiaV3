# Export des User Stories

## À faire

- [ ] **US01 — Connexion partenaire** (ID: 70) — Priorité: Critique  
  En tant que partenaire, je veux me connecter au back-office afin de gérer mes chasses.  
  Critères d’acceptation :  
  • Formulaire email/mot de passe.  
  • Appel API de connexion.  
  • Stockage du JWT.  
  • Redirection vers le dashboard partenaire.  
  • Message d’erreur si identifiants invalides.

- [ ] **US02 — Connexion administrateur** (ID: 71) — Priorité: Critique  
  En tant qu’administrateur, je veux me connecter de manière sécurisée afin d’accéder à la console admin.  
  Critères d’acceptation :  
  • Auth admin distincte ou filtrée par rôle.  
  • Accès refusé si rôle non admin.  
  • Session sécurisée via JWT.

- [ ] **US03 — Inscription/compte partenaire** (ID: 72) — Priorité: Haute  
  En tant que partenaire, je veux créer un compte afin d’accéder au back-office.  
  Critères d’acceptation :  
  • Formulaire d’inscription.  
  • Création du compte avec rôle partner.  
  • Validation des champs.

- [ ] **US04 — Accès joueur en mode invité** (ID: 73) — Priorité: Critique  
  En tant que joueur, je veux accéder à l’application sans créer de compte afin de commencer une chasse rapidement.  
  Critères d’acceptation :  
  • Entrée possible sans inscription.  
  • Les chasses sont consultables en mode invité.  
  • Les limites du mode invité sont explicites, notamment sur la sauvegarde de progression.

- [ ] **US05 — Gestion des rôles et autorisations** (ID: 74) — Priorité: Haute  
  En tant que système, je veux contrôler les accès selon le rôle joueur, partenaire ou administrateur afin de sécuriser les fonctionnalités.  
  Critères d’acceptation :  
  • Endpoints protégés par rôle.  
  • Front web/mobile masque les accès non autorisés.  
  • Refus d’accès côté API si permissions insuffisantes.

- [ ] **US06 — Voir les chasses sur une carte** (ID: 76) — Priorité: Critique  
  En tant que joueur, je veux visualiser les chasses géolocalisées sur une carte interactive afin de choisir une activité proche de moi.  
  Critères d’acceptation :  
  • Carte affichée avec les chasses.  
  • Chargement des chasses proches.  
  • Géolocalisation demandée avec consentement explicite.  
  • Gestion du refus GPS.

- [ ] **US07 — Rechercher une chasse** (ID: 77) — Priorité: Critique  
  En tant que joueur, je veux rechercher une chasse via une barre de recherche afin de trouver rapidement un parcours précis.  
  Critères d’acceptation :  
  • Champ de recherche disponible.  
  • Filtrage ou recherche côté API.  
  • Résultats affichés clairement.

- [ ] **US08 — Consulter le détail d’une chasse** (ID: 78) — Priorité: Haute  
  En tant que joueur, je veux voir la fiche d’une chasse afin de connaître son contenu avant de la rejoindre.  
  Critères d’acceptation :  
  • Affichage titre, description, difficulté, durée, points.  
  • Chargement via GET /hunts/:id.  
  • Interface lisible mobile-first.

- [ ] **US09 — Rejoindre une chasse** (ID: 79) — Priorité: Critique  
  En tant que joueur, je veux rejoindre une chasse depuis la carte afin de démarrer le parcours.  
  Critères d’acceptation :  
  • Bouton “Rejoindre”.  
  • Chargement de la première étape.  
  • Création de progression si joueur connecté.  
  • Navigation vers l’écran de chasse en cours.

- [ ] **US10 — Voir la progression sur la carte** (ID: 80) — Priorité: Haute  
  En tant que joueur, je veux afficher les étapes de progression sur la carte afin de savoir où aller ensuite.  
  Critères d’acceptation :  
  • Étape courante visible.  
  • États des étapes cohérents avec la progression.  
  • Mise à jour après validation d’une étape.

- [ ] **US11 — Valider une étape par proximité** (ID: 81)  
  En tant que joueur, je veux valider une étape quand je suis dans le bon rayon afin de progresser dans la chasse.  
  Critères d’acceptation :  
  • Vérification GPS par rayon de validation.  
  • Bouton actif seulement si condition remplie.  
  • Mise à jour de la progression et des points.

- [ ] **US12 — Scanner une étape en RA simple** (ID: 82) — Priorité: Moyenne  
  En tant que joueur, je veux scanner mon environnement et voir un overlay 2D afin d’avoir une expérience immersive.  
  Critères d’acceptation :  
  • Accès caméra.  
  • Écran de scan.  
  • Affichage de l’overlay configuré pour l’étape.  
  • Retour stable sans blocage si la RA échoue.

- [ ] **US13 — Voir mes points et badges** (ID: 83) — Priorité: Moyenne  
  En tant que joueur, je veux consulter mes points, badges et ma progression afin de suivre mes performances.  
  Critères d’acceptation :  
  • Écran profil.  
  • Historique des chasses pour utilisateur connecté.  
  • Liste badges et total de points.

- [ ] **US14 — Sauvegarder ma progression si j’ai un compte** (ID: 84) — Priorité: Haute  
  En tant que joueur authentifié, je veux retrouver ma progression afin de reprendre une chasse plus tard.  
  Critères d’acceptation :  
  • Progression persistée en base.  
  • Reprise à l’étape courante.  
  • Pas de sauvegarde permanente pour le mode invité.

- [ ] **US15 — Utiliser l’application en français et en anglais** (ID: 86)  
  En tant que joueur, je veux utiliser l’application en français ou en anglais afin de mieux comprendre l’interface.  
  Critères d’acceptation :  
  • Deux langues disponibles.  
  • Libellés principaux traduits.  
  • Changement de langue pris en compte sur les écrans clés.

- [ ] **US16 — Accéder au dashboard partenaire** (ID: 87) — Priorité: Critique  
  En tant que partenaire, je veux voir un tableau de bord afin de piloter mes chasses.  
  Critères d’acceptation :  
  • Vue d’ensemble après connexion.  
  • KPI de base visibles.  
  • Navigation vers gestion des chasses et statistiques.

- [ ] **US17 — Créer une chasse** (ID: 88) — Priorité: Critique  
  En tant que partenaire, je veux créer une chasse afin de publier un nouveau parcours.  
  Critères d’acceptation :  
  • Formulaire de création.  
  • Champs titre, description, durée, difficulté, points, localisation.  
  • Enregistrement via API.  
  • Confirmation visuelle de succès.

- [ ] **US18 — Modifier une chasse** (ID: 89) — Priorité: Critique  
  En tant que partenaire, je veux modifier une chasse afin de corriger son contenu.  
  Critères d’acceptation :  
  • Préremplissage des données.  
  • Sauvegarde des changements.  
  • Contrôle d’accès au propriétaire/partenaire.

- [ ] **US19 — Supprimer une chasse** (ID: 90) — Priorité: Critique  
  En tant que partenaire, je veux supprimer une chasse afin de retirer un parcours obsolète.  
  Critères d’acceptation :  
  • Action protégée par confirmation.  
  • Suppression cohérente des données liées selon règle métier.  
  • Mise à jour immédiate de la liste.

- [ ] **US20 — Utiliser un template de chasse** (ID: 91) — Priorité: Critique  
  En tant que partenaire, je veux partir d’un template prédéfini afin de créer plus vite une chasse.  
  Critères d’acceptation :  
  • Liste de templates disponible.  
  • Préremplissage du formulaire.  
  • Possibilité de personnalisation avant publication.

- [ ] **US21 — Ajouter un plan ou une image** (ID: 92) — Priorité: Haute  
  En tant que partenaire, je veux uploader un plan ou une image afin d’enrichir la chasse.  
  Critères d’acceptation :  
  • Upload de fichier fonctionnel.  
  • Validation format/taille.  
  • Fichier stocké et URL récupérée.

- [ ] **US22 — Définir des zones sur le plan** (ID: 93) — Priorité: Critique  
  En tant que partenaire, je veux définir des zones sur un plan afin de positionner les étapes ou interactions.  
  Critères d’acceptation :  
  • Interface de sélection/placement.  
  • Sauvegarde des zones.  
  • Restitution cohérente lors de l’édition.

- [ ] **US23 — Gérer les étapes d’une chasse** (ID: 96) — Priorité: Critique  
  En tant que partenaire, je veux créer, modifier et supprimer les étapes d’une chasse afin de construire le parcours.  
  Critères d’acceptation :  
  • CRUD complet des étapes.  
  • Gestion ordre, titre, description, coordonnées GPS, rayon.  
  • Persistance correcte en base.

- [ ] **US24 — Configurer les éléments RA d’une étape** (ID: 97) — Priorité: Critique  
  En tant que partenaire, je veux configurer un overlay RA par étape afin de personnaliser l’expérience joueur.  
  Critères d’acceptation :  
  • Formulaire de configuration RA.  
  • Sauvegarde du contenu dans la structure prévue.  
  • Données exploitables par le mobile.

- [ ] **US25 — Voir les statistiques de base d’une chasse** (ID: 98) — Priorité: Haute  
  En tant que partenaire, je veux consulter les statistiques de mes chasses afin d’évaluer leur utilisation.  
  Critères d’acceptation :  
  • Nombre de participants.  
  • Taux de complétion.  
  • Vue claire sur dashboard ou page dédiée.

- [ ] **US26 — Voir la liste des participants** (ID: 99) — Priorité: Critique  
  En tant que partenaire, je veux consulter la liste des participants d’une chasse afin de suivre l’activité.  
  Critères d’acceptation :  
  • Liste paginée ou simple.  
  • Données cohérentes avec les progressions.  
  • Accès réservé au partenaire autorisé.

- [ ] **US27 — Voir le dashboard global admin** (ID: 100) — Priorité: Critique  
  En tant qu’administrateur, je veux accéder à un dashboard global afin de suivre l’activité de la plateforme.  
  Critères d’acceptation :  
  • KPI globaux visibles après connexion.  
  • Accès réservé au rôle admin.  
  • Données agrégées fiables

- [ ] **US28 — Voir le nombre de joueurs et de chasses créées** (ID: 101) — Priorité: Haute  
  En tant qu’administrateur, je veux consulter les métriques globales afin d’évaluer l’adoption de la plateforme.  
  Critères d’acceptation :  
  • Nombre total de joueurs.  
  • Nombre total de chasses.  
  • Mise à jour depuis l’API stats

- [ ] **US29 — Voir les taux de participation et de complétion** (ID: 102) — Priorité: Haute  
  En tant qu’administrateur, je veux consulter les taux de participation et de complétion afin de mesurer l’engagement.  
  Critères d’acceptation :  
  • KPI calculés correctement.  
  • Affichage simple, lisible.  
  • Cohérence avec les données de progression.

- [ ] **US30 — Exposer l’API d’authentification** (ID: 103) — Priorité: Critique  
  En tant que système, je veux disposer d’API de login/register afin de permettre l’accès sécurisé aux interfaces.  
  Critères d’acceptation :  
  • POST /auth/login disponible.  
  • POST /auth/register disponible pour partenaire.  
  • JWT retourné après succès.  
  • Validation des données d’entrée

- [ ] **US31 — Exposer l’API des chasses** (ID: 104) — Priorité: Critique  
  En tant que système, je veux exposer les endpoints de lecture et gestion des chasses afin d’alimenter mobile et web.  
  Critères d’acceptation :  
  • GET /hunts.  
  • GET /hunts/:id.  
  • POST /hunts.  
  • PUT /hunts/:id.  
  • DELETE /hunts/:id.

- [ ] **US32 — Exposer l’API des étapes** (ID: 105) — Priorité: Haute  
  En tant que système, je veux exposer les endpoints liés aux étapes afin de gérer les parcours.  
  Critères d’acceptation :  
  • POST /steps minimum pour création.  
  • Évolution possible vers CRUD complet.  
  • Validation des coordonnées, ordre et rayon.

- [ ] **US33 — Gérer la progression joueur** (ID: 106) — Priorité: Critique  
  En tant que système, je veux stocker et mettre à jour la progression des joueurs afin de suivre leur avancement.  
  Critères d’acceptation :  
  • GET /progress/:huntId.  
  • POST /progress/:huntId/validate.  
  • Mise à jour current_step, completed_steps, total_points.  
  • Gestion correcte du mode connecté vs invité.

- [ ] **US34 — Calculer la validation géographique** (ID: 107) — Priorité: Haute  
  En tant que système, je veux calculer si le joueur est dans le rayon d’une étape afin d’autoriser la validation.  
  Critères d’acceptation :  
  • Utilisation des coordonnées étape/joueur.  
  • Rayon configurable.  
  • Retour booléen fiable via logique PostGIS.

- [ ] **US35 — Gérer les badges et points** (ID: 108) — Priorité: Moyenne  
  En tant que système, je veux attribuer points et badges afin de supporter la gamification.  
  Critères d’acceptation :  
  • Attribution à la validation d’étape ou fin de chasse.  
  • Données stockées en base.  
  • Restitution pour le profil joueur.

- [ ] **US36 — Gérer l’upload de fichiers** (ID: 109) — Priorité: Haute  
  En tant que système, je veux traiter l’upload des plans et images afin de les rendre disponibles au back-office et au mobile.  
  Critères d’acceptation :  
  • Endpoint multipart/form-data.  
  • Contrôles de sécurité basiques.  
  • URL exploitable après stockage.

- [ ] **US37 — Exposer les statistiques** (ID: 110) — Priorité: Haute  
  En tant que système, je veux fournir des endpoints de statistiques afin d’alimenter les dashboards partenaire et admin.  
  Critères d’acceptation :  
  • GET /stats/hunts disponible.  
  • KPI globaux et/ou par chasse.  
  • Données cohérentes avec progressions et chasses.

- [ ] **US38 — Mettre en place le schéma de base de données** (ID: 111) — Priorité: Critique  
  En tant que système, je veux disposer des tables users, hunts, steps, progress et badges afin de supporter le produit.  
  Critères d’acceptation :  
  • Modèle relationnel cohérent.  
  • Relations et contraintes créées.  
  • Support PostGIS pour la géolocalisation.

- [ ] **US39 — Sécuriser les endpoints** (ID: 112) — Priorité: Haute  
  En tant que système, je veux protéger les endpoints via JWT, guards et validation afin de respecter les exigences de sécurité.  
  Critères d’acceptation :  
  • Guards par rôle.  
  • Validation des payloads.  
  • Rate limiting et CORS configurés.

- [ ] **US40 — Prévoir la conformité RGPD minimale** (ID: 113) — Priorité: Moyenne  
  En tant que système, je veux minimiser les données et permettre les mécanismes requis afin de respecter les contraintes RGPD du projet.  
  Critères d’acceptation :  
  • Consentement GPS explicite.  
  • Mode invité possible.  
  • Suppression de compte/données prévue.  
  • Stockage sécurisé des données personnelles.