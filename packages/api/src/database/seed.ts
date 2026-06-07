/**
 * Seeder Lootopia — données de démonstration
 *
 * Usage : npm run seed (depuis packages/api)
 *
 * Crée :
 *  - 1 admin, 2 partenaires, 6 joueurs
 *  - 3 chasses par partenaire (2 actives + 1 brouillon)
 *  - 3 étapes par chasse active, 2 par brouillon
 *  - 2 zones par chasse
 *  - Progressions variées (terminées / en cours)
 *  - Badges mérités
 *
 * Idempotent : supprime d'abord les données identifiées par email/titre de seed.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

// Charge le .env depuis la racine de packages/api
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Entités ─────────────────────────────────────────────────────────────────

import { UserEntity } from '../modules/users/entities/user.entity';
import { HuntEntity } from '../modules/hunts/entities/hunt.entity';
import { StepEntity } from '../modules/steps/entities/step.entity';
import { ZoneEntity } from '../modules/zones/entities/zone.entity';
import { ProgressEntity } from '../modules/progress/entities/progress.entity';
import { BadgeEntity } from '../modules/badges/entities/badge.entity';

// ─── DataSource ───────────────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'lootopia',
  password: process.env.DB_PASSWORD || 'changeme',
  database: process.env.DB_NAME || 'lootopia',
  entities: [UserEntity, HuntEntity, StepEntity, ZoneEntity, ProgressEntity, BadgeEntity],
  synchronize: true, // crée les tables si elles n'existent pas encore
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Formate une date passée en soustrayant des jours à aujourd'hui */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Données de référence ────────────────────────────────────────────────────

const PARTNER_PASSWORD = 'Partner123';
const PLAYER_PASSWORD  = 'Player123';
const ADMIN_PASSWORD   = 'Admin1234';

const SEED_EMAILS = {
  admin:    'admin@lootopia.fr',
  partner1: 'musee@lootopia.fr',
  partner2: 'parc@lootopia.fr',
  alice:    'alice@example.com',
  bob:      'bob@example.com',
  charlie:  'charlie@example.com',
  diana:    'diana@example.com',
  eve:      'eve@example.com',
  frank:    'frank@example.com',
};

// Titres réservés au seeder — utilisés pour la phase de nettoyage
const SEED_HUNT_TITLES = [
  'Mystères du Louvre',
  'Secrets de Montmartre',
  "L'Énigme des Catacombes",
  'Chasse aux Papillons',
  'Les Oiseaux Cachés',
  'Trail de la Dombes',
  'Les secrets de saint-jacques',
];

// ─── Seed principal ───────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('✔ Connexion à la base de données établie.');

  const userRepo     = AppDataSource.getRepository(UserEntity);
  const huntRepo     = AppDataSource.getRepository(HuntEntity);
  const stepRepo     = AppDataSource.getRepository(StepEntity);
  const zoneRepo     = AppDataSource.getRepository(ZoneEntity);
  const progressRepo = AppDataSource.getRepository(ProgressEntity);
  const badgeRepo    = AppDataSource.getRepository(BadgeEntity);

  // ── 1. Nettoyage des données de seed précédentes ─────────────────────────
  console.log('🧹 Nettoyage des données de seed précédentes…');

  const existingHunts = await huntRepo.find({
    where: SEED_HUNT_TITLES.map((title) => ({ title })),
  });
  if (existingHunts.length > 0) {
    // La suppression des hunts cascade sur steps/zones/progress (CASCADE en DB)
    await huntRepo.remove(existingHunts);
  }

  const existingUsers = await userRepo.find({
    where: Object.values(SEED_EMAILS).map((email) => ({ email })),
  });
  if (existingUsers.length > 0) {
    await userRepo.remove(existingUsers);
  }

  console.log('  → Nettoyage terminé.');

  // ── 2. Utilisateurs ───────────────────────────────────────────────────────
  console.log('👤 Création des utilisateurs…');

  const [adminHash, partnerHash, playerHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 10),
    bcrypt.hash(PARTNER_PASSWORD, 10),
    bcrypt.hash(PLAYER_PASSWORD, 10),
  ]);

  const [admin, partner1, partner2, alice, bob, charlie, diana, eve, frank] =
    await userRepo.save([
      { email: SEED_EMAILS.admin,    password_hash: adminHash,   role: 'ADMIN'   as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.partner1, password_hash: partnerHash, role: 'PARTNER' as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.partner2, password_hash: partnerHash, role: 'PARTNER' as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.alice,    password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.bob,      password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.charlie,  password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: false },
      { email: SEED_EMAILS.diana,    password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.eve,      password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: true },
      { email: SEED_EMAILS.frank,    password_hash: playerHash,  role: 'PLAYER'  as any, is_guest: false, consent_gps: true },
    ]);

  console.log(`  → ${9} utilisateurs créés.`);
  void admin; // utilisé pour montrer qu'il existe

  // ── 3. Chasses ────────────────────────────────────────────────────────────
  console.log('🗺  Création des chasses…');

  // Coordonnées GPS : POINT(longitude latitude) → WKT pour PostGIS
  // TypeORM avec geography : on passe le WKT sous forme d'objet via query builder
  // Insertion en deux temps : d'abord sans coordonnées, puis UPDATE raw pour les coords

  const huntsData = [
    // Partner 1 — Musée de Paris
    {
      partner_id: partner1.id,
      title: 'Mystères du Louvre',
      description: 'Parcourez les grandes galeries du Louvre à la recherche d\'indices dissimulés parmi les œuvres majeures. Chaque étape révèle un secret du musée.',
      location: 'Paris 1er — Musée du Louvre',
      difficulty: 'medium',
      duration: 90,
      points: 200,
      is_active: true,
      lng: 2.3376, lat: 48.8606,
    },
    {
      partner_id: partner1.id,
      title: 'Secrets de Montmartre',
      description: 'Explorez la Butte Montmartre et ses ruelles pittoresques. Découvrez les histoires d\'artistes et les recoins cachés du quartier bohème.',
      location: 'Paris 18e — Montmartre',
      difficulty: 'easy',
      duration: 60,
      points: 100,
      is_active: true,
      lng: 2.3431, lat: 48.8867,
    },
    {
      partner_id: partner1.id,
      title: "L'Énigme des Catacombes",
      description: 'Une aventure dans les entrailles de Paris. Résolvez des énigmes inspirées de l\'histoire des catacombes sans jamais y descendre.',
      location: 'Paris 14e — Denfert-Rochereau',
      difficulty: 'hard',
      duration: 120,
      points: 350,
      is_active: false, // Brouillon
      lng: 2.3323, lat: 48.8338,
    },
    // Partner 2 — Parc de Lyon
    {
      partner_id: partner2.id,
      title: 'Chasse aux Papillons',
      description: 'Une chasse familiale au cœur du Parc de la Tête d\'Or. Identifiez les espèces de papillons et récoltez des indices botaniques.',
      location: 'Lyon 6e — Parc de la Tête d\'Or',
      difficulty: 'easy',
      duration: 45,
      points: 80,
      is_active: true,
      lng: 4.8518, lat: 45.7766,
    },
    {
      partner_id: partner2.id,
      title: 'Les Oiseaux Cachés',
      description: 'Partez à l\'observation des oiseaux nicheurs dans le parc ornithologique. Chaque étape est un nouveau défi de reconnaissance.',
      location: 'Lyon 6e — Parc ornithologique',
      difficulty: 'medium',
      duration: 75,
      points: 180,
      is_active: true,
      lng: 4.8534, lat: 45.7781,
    },
    {
      partner_id: partner2.id,
      title: 'Trail de la Dombes',
      description: 'Un parcours exigeant à travers les étangs de la Dombes. Navigation, ornithologie et histoire locale au programme.',
      location: 'Ain — Dombes',
      difficulty: 'hard',
      duration: 150,
      points: 400,
      is_active: false, // Brouillon
      lng: 5.0250, lat: 45.9800,
    },
    // Partner 1 — chasse AR test (plusieurs œuvres à scanner)
    {
      partner_id: partner1.id,
      title: 'Les secrets de saint-jacques',
      description: 'Parcourez ce musée fictif et scannez chaque tableau pour révéler son secret en réalité augmentée. Quatre œuvres majeures vous attendent.',
      location: '278 rue de Nantes, Saint-Jacques-de-la-Lande',
      difficulty: 'medium',
      duration: 60,
      points: 200,
      is_active: true,
      lng: -1.69373, lat: 48.08900,
    },
  ];

  // Insertion des chasses (sans coordonnées d'abord)
  const savedHunts: HuntEntity[] = [];
  for (const h of huntsData) {
    const { lng, lat, ...huntFields } = h;
    const hunt = await huntRepo.save(huntRepo.create(huntFields as Partial<HuntEntity>));

    // Mise à jour de la colonne geography avec raw SQL
    if (lng !== undefined && lat !== undefined) {
      await AppDataSource.query(
        `UPDATE hunts SET coordinates = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
        [lng, lat, hunt.id],
      );
    }
    savedHunts.push(hunt);
  }

  const [louvre, montmartre, catacombes, papillons, oiseaux, dombes, saintjacques] = savedHunts;
  console.log(`  → ${savedHunts.length} chasses créées.`);

  // ── 4. Étapes ─────────────────────────────────────────────────────────────
  console.log('📍 Création des étapes…');

  type StepSeed = {
    hunt_id: string;
    order: number;
    title: string;
    description: string;
    validation_radius: number;
    validation_type?: string;
    ar_content: Record<string, unknown> | null;
    lng: number;
    lat: number;
  };

  const stepsData: StepSeed[] = [
    // Mystères du Louvre (3 étapes)
    { hunt_id: louvre.id, order: 1, title: 'La Joconde', description: 'Trouvez le tableau le plus célèbre du monde et lisez le cartel. Quel est son autre nom ?', validation_radius: 30, ar_content: { type: '2d-overlay', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/300px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' }, lng: 2.3376, lat: 48.8606 },
    { hunt_id: louvre.id, order: 2, title: 'La Victoire de Samothrace', description: 'Montez vers la statue ailée et comptez les marches de l\'escalier Daru.', validation_radius: 40, ar_content: null, lng: 2.3370, lat: 48.8602 },
    { hunt_id: louvre.id, order: 3, title: 'La Pyramide inversée', description: 'Retrouvez la petite pyramide sous la grande et placez-vous en son centre.', validation_radius: 20, ar_content: null, lng: 2.3356, lat: 48.8638 },

    // Secrets de Montmartre (3 étapes)
    { hunt_id: montmartre.id, order: 1, title: 'La Place du Tertre', description: 'Rejoignez la place des peintres et cherchez le numéro de la première maison sur votre gauche.', validation_radius: 50, ar_content: null, lng: 2.3408, lat: 48.8865 },
    { hunt_id: montmartre.id, order: 2, title: 'Le Vignoble de Montmartre', description: 'L\'unique vignoble de Paris cache une plaque. Quelle est l\'année de sa création ?', validation_radius: 30, ar_content: null, lng: 2.3387, lat: 48.8872 },
    { hunt_id: montmartre.id, order: 3, title: 'Le Sacré-Cœur', description: 'Depuis le parvis, regardez vers Paris. Quel monument apercevez-vous à l\'est ?', validation_radius: 60, ar_content: null, lng: 2.3431, lat: 48.8867 },

    // L'Énigme des Catacombes (2 étapes — brouillon)
    { hunt_id: catacombes.id, order: 1, title: 'L\'Entrée des Enfers', description: 'Devant l\'entrée des catacombes, déchiffrez l\'inscription latine sur le fronton.', validation_radius: 20, ar_content: null, lng: 2.3323, lat: 48.8338 },
    { hunt_id: catacombes.id, order: 2, title: 'Le Lion de Denfert', description: 'Le lion en bronze surveille la place. Dans quelle direction son regard se porte-t-il ?', validation_radius: 40, ar_content: null, lng: 2.3327, lat: 48.8341 },

    // Chasse aux Papillons (3 étapes)
    { hunt_id: papillons.id, order: 1, title: 'La Roseraie', description: 'Près des rosiers, observez les papillons. Combien d\'espèces différentes pouvez-vous compter ?', validation_radius: 30, ar_content: { type: '2d-overlay', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/220px-Camponotus_flavomarginatus_ant.jpg' }, lng: 4.8518, lat: 45.7766 },
    { hunt_id: papillons.id, order: 2, title: 'Le Plan d\'eau', description: 'Aux abords du lac, cherchez un panneau d\'information sur la faune locale.', validation_radius: 40, ar_content: null, lng: 4.8510, lat: 45.7758 },
    { hunt_id: papillons.id, order: 3, title: 'La Serre tropicale', description: 'Devant la grande serre, lisez la plaque dédicatoire. À qui est-elle dédiée ?', validation_radius: 25, ar_content: null, lng: 4.8525, lat: 45.7773 },

    // Les Oiseaux Cachés (3 étapes)
    { hunt_id: oiseaux.id, order: 1, title: 'Le Nid des Hérons', description: 'Repérez la héronnière dans les arbres. Combien de nids comptez-vous ?', validation_radius: 50, ar_content: null, lng: 4.8534, lat: 45.7781 },
    { hunt_id: oiseaux.id, order: 2, title: 'L\'Île aux Oiseaux', description: 'Sur le pont de l\'île, identifiez trois espèces de canards présentes.', validation_radius: 30, ar_content: null, lng: 4.8528, lat: 45.7775 },
    { hunt_id: oiseaux.id, order: 3, title: 'Le Poste d\'Observation', description: 'Depuis le mirador, notez la direction du vol des cigognes.', validation_radius: 40, ar_content: null, lng: 4.8540, lat: 45.7788 },

    // Trail de la Dombes (2 étapes — brouillon)
    { hunt_id: dombes.id, order: 1, title: 'L\'Étang Principal', description: 'Au bord de l\'étang, identifiez le type de roselière présente sur la rive nord.', validation_radius: 80, ar_content: null, lng: 5.0250, lat: 45.9800 },
    { hunt_id: dombes.id, order: 2, title: 'La Ferme de la Dombes', description: 'Relevez l\'année gravée sur le linteau de la grange ancienne.', validation_radius: 50, ar_content: null, lng: 5.0300, lat: 45.9850 },

    // Les secrets de saint-jacques (4 étapes AR — test réalité augmentée)
    {
      hunt_id: saintjacques.id, order: 1,
      title: 'La Jeune Fille à la Perle',
      description: 'Pointez votre caméra sur ce tableau de Vermeer pour révéler son secret en RA.',
      validation_radius: 50,
      validation_type: 'ar',
      ar_content: {
        type: 'ar-3d-spatial',
        marker_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/300px-1665_Girl_with_a_Pearl_Earring.jpg',
        artwork_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/300px-1665_Girl_with_a_Pearl_Earring.jpg',
      },
      lng: -1.69373, lat: 48.08900,
    },
    {
      hunt_id: saintjacques.id, order: 2,
      title: 'La Nuit Étoilée',
      description: 'Retrouvez ce chef-d\'œuvre de Van Gogh et scannez-le pour voir les étoiles s\'animer.',
      validation_radius: 50,
      validation_type: 'ar',
      ar_content: {
        type: 'ar-3d-spatial',
        marker_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/300px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
        artwork_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/300px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
      },
      lng: -1.69390, lat: 48.08920,
    },
    {
      hunt_id: saintjacques.id, order: 3,
      title: 'La Ronde de Nuit',
      description: 'Découvrez le mystère derrière cette toile monumentale de Rembrandt.',
      validation_radius: 50,
      validation_type: 'ar',
      ar_content: {
        type: 'ar-3d-spatial',
        marker_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Night_Watch_-_HD.jpg/300px-The_Night_Watch_-_HD.jpg',
        artwork_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/The_Night_Watch_-_HD.jpg/300px-The_Night_Watch_-_HD.jpg',
      },
      lng: -1.69355, lat: 48.08880,
    },
    {
      hunt_id: saintjacques.id, order: 4,
      title: 'Les Nymphéas',
      description: 'Laissez Monet vous emmener dans son jardin d\'eau en réalité augmentée.',
      validation_radius: 50,
      validation_type: 'ar',
      ar_content: {
        type: 'ar-3d-spatial',
        marker_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/300px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
        artwork_image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/300px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg',
      },
      lng: -1.69410, lat: 48.08910,
    },
  ];

  for (const s of stepsData) {
    const { lng, lat, ...stepFields } = s;
    const created = stepRepo.create(stepFields as Partial<StepEntity>);
    const step = (await stepRepo.save(created)) as StepEntity;
    await AppDataSource.query(
      `UPDATE steps SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      [lng, lat, step.id],
    );
  }

  console.log(`  → ${stepsData.length} étapes créées.`);

  // ── 5. Zones ──────────────────────────────────────────────────────────────
  console.log('🔷 Création des zones…');

  const zonesData = [
    // Louvre
    { hunt_id: louvre.id, label: 'Aile Richelieu',   order: 1, shape: { type: 'rect',   x: 50,  y: 80,  width: 200, height: 120 } },
    { hunt_id: louvre.id, label: 'Aile Sully',        order: 2, shape: { type: 'rect',   x: 280, y: 80,  width: 180, height: 120 } },
    // Montmartre
    { hunt_id: montmartre.id, label: 'Place du Tertre', order: 1, shape: { type: 'circle', cx: 200, cy: 150, radius: 80 } },
    { hunt_id: montmartre.id, label: 'Vignoble',        order: 2, shape: { type: 'rect',   x: 80,  y: 200, width: 150, height: 100 } },
    // Papillons
    { hunt_id: papillons.id, label: 'Zone Est',   order: 1, shape: { type: 'rect',   x: 30,  y: 40,  width: 250, height: 180 } },
    { hunt_id: papillons.id, label: 'Zone Ouest', order: 2, shape: { type: 'circle', cx: 350, cy: 220, radius: 90 } },
    // Oiseaux
    { hunt_id: oiseaux.id, label: "Zone d'observation", order: 1, shape: { type: 'polygon', points: [{ x: 100, y: 50 }, { x: 300, y: 50 }, { x: 350, y: 200 }, { x: 150, y: 250 }, { x: 50, y: 180 }] } },
    { hunt_id: oiseaux.id, label: 'Île centrale',        order: 2, shape: { type: 'circle', cx: 200, cy: 300, radius: 70 } },
  ];

  const zoneEntities = zonesData.map((z) => zoneRepo.create(z as Partial<ZoneEntity>));
  await zoneRepo.save(zoneEntities);
  console.log(`  → ${zonesData.length} zones créées.`);

  // ── 6. Progressions ───────────────────────────────────────────────────────
  console.log('🏃 Création des progressions…');

  const progressData: Partial<ProgressEntity>[] = [
    // Alice — terminé "Mystères du Louvre" il y a 8 jours
    {
      user_id: alice.id, hunt_id: louvre.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 200,
      started_at: daysAgo(10), completed_at: daysAgo(8),
    },
    // Alice — en cours "Chasse aux Papillons", étape 2
    {
      user_id: alice.id, hunt_id: papillons.id,
      current_step: 2, completed_steps: [1],
      total_points: 25,
      started_at: daysAgo(2), completed_at: null,
    },
    // Bob — terminé "Mystères du Louvre" il y a 6 jours
    {
      user_id: bob.id, hunt_id: louvre.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 200,
      started_at: daysAgo(9), completed_at: daysAgo(6),
    },
    // Bob — terminé "Les Oiseaux Cachés" il y a 4 jours
    {
      user_id: bob.id, hunt_id: oiseaux.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 180,
      started_at: daysAgo(7), completed_at: daysAgo(4),
    },
    // Charlie — en cours "Secrets de Montmartre", étape 1
    {
      user_id: charlie.id, hunt_id: montmartre.id,
      current_step: 1, completed_steps: [],
      total_points: 0,
      started_at: daysAgo(1), completed_at: null,
    },
    // Diana — terminé "Chasse aux Papillons" il y a 3 jours
    {
      user_id: diana.id, hunt_id: papillons.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 80,
      started_at: daysAgo(5), completed_at: daysAgo(3),
    },
    // Diana — en cours "Mystères du Louvre", étape 2
    {
      user_id: diana.id, hunt_id: louvre.id,
      current_step: 2, completed_steps: [1],
      total_points: 60,
      started_at: daysAgo(1), completed_at: null,
    },
    // Eve — en cours "Les Oiseaux Cachés", étape 2
    {
      user_id: eve.id, hunt_id: oiseaux.id,
      current_step: 2, completed_steps: [1],
      total_points: 55,
      started_at: daysAgo(3), completed_at: null,
    },
    // Frank — terminé "Secrets de Montmartre" il y a 2 jours
    {
      user_id: frank.id, hunt_id: montmartre.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 100,
      started_at: daysAgo(4), completed_at: daysAgo(2),
    },
    // Frank — terminé "Chasse aux Papillons" il y a 1 jour
    {
      user_id: frank.id, hunt_id: papillons.id,
      current_step: 3, completed_steps: [1, 2, 3],
      total_points: 80,
      started_at: daysAgo(3), completed_at: daysAgo(1),
    },
  ];

  await progressRepo.save(progressData.map((p) => progressRepo.create(p)));
  console.log(`  → ${progressData.length} progressions créées.`);

  // ── 7. Badges ─────────────────────────────────────────────────────────────
  console.log('🏅 Création des badges…');

  const badgesData: Partial<BadgeEntity>[] = [
    // Alice
    { user_id: alice.id, badge_type: 'first_hunt',     earned_at: daysAgo(8) },
    { user_id: alice.id, badge_type: 'hunt_completed', earned_at: daysAgo(8) },
    // Bob
    { user_id: bob.id, badge_type: 'first_hunt',     earned_at: daysAgo(6) },
    { user_id: bob.id, badge_type: 'hunt_completed', earned_at: daysAgo(6) },
    { user_id: bob.id, badge_type: 'explorer',       earned_at: daysAgo(4) }, // 2 chasses terminées
    // Charlie
    { user_id: charlie.id, badge_type: 'first_hunt', earned_at: daysAgo(1) },
    // Diana
    { user_id: diana.id, badge_type: 'first_hunt',     earned_at: daysAgo(3) },
    { user_id: diana.id, badge_type: 'hunt_completed', earned_at: daysAgo(3) },
    // Frank
    { user_id: frank.id, badge_type: 'first_hunt',     earned_at: daysAgo(2) },
    { user_id: frank.id, badge_type: 'hunt_completed', earned_at: daysAgo(2) },
    { user_id: frank.id, badge_type: 'explorer',       earned_at: daysAgo(1) },
  ];

  await badgeRepo.save(badgesData.map((b) => badgeRepo.create(b)));
  console.log(`  → ${badgesData.length} badges attribués.`);

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed terminé avec succès !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Comptes créés :');
  console.log(`  Admin      : ${SEED_EMAILS.admin}    / ${ADMIN_PASSWORD}`);
  console.log(`  Partenaire : ${SEED_EMAILS.partner1} / ${PARTNER_PASSWORD}`);
  console.log(`  Partenaire : ${SEED_EMAILS.partner2}  / ${PARTNER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.alice}   / ${PLAYER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.bob}     / ${PLAYER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.charlie} / ${PLAYER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.diana}   / ${PLAYER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.eve}     / ${PLAYER_PASSWORD}`);
  console.log(`  Joueur     : ${SEED_EMAILS.frank}   / ${PLAYER_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
