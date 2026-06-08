export interface HuntTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: {
    title: string;
    description: string;
    difficulty: string;
    duration: number;
    points: number;
  };
  stepsHint: string[];
}

export const HUNT_TEMPLATES: HuntTemplate[] = [
  {
    id: 'museum-ar',
    name: 'Musée — Découverte AR',
    description: 'Chasse en intérieur pour un musée. Les joueurs scannent des œuvres pour faire apparaître des informations en réalité augmentée.',
    icon: '🎨',
    defaults: {
      title: 'À la découverte des chefs-d\'œuvre',
      description: 'Partez à la découverte des trésors du musée. Scannez les œuvres et laissez-les vous révéler leurs secrets !',
      difficulty: 'easy',
      duration: 45,
      points: 300,
    },
    stepsHint: [
      'Devant le tableau principal — scanner l\'œuvre',
      'Salle des sculptures — observer et répondre au quiz',
      'Galerie temporaire — valider par géolocalisation',
    ],
  },
  {
    id: 'city-trail',
    name: 'Circuit touristique',
    description: 'Parcours géolocalisé en ville. Les joueurs se rendent de point en point pour découvrir les monuments et lieux emblématiques.',
    icon: '🏛️',
    defaults: {
      title: 'Les secrets de la ville',
      description: 'Suivez le parcours et découvrez les anecdotes cachées de la ville. De place en place, l\'histoire se révèle.',
      difficulty: 'medium',
      duration: 90,
      points: 450,
    },
    stepsHint: [
      'Place centrale — valider par GPS',
      'Monument historique — scanner le QR code sur l\'affiche',
      'Marché couvert — répondre à l\'énigme',
      'Tour ou beffroi — valider la position finale',
    ],
  },
  {
    id: 'heritage-photo',
    name: 'Patrimoine & Photo',
    description: 'Parcours de découverte patrimoniale où les joueurs photographient des détails cachés des lieux pour valider leurs étapes.',
    icon: '📸',
    defaults: {
      title: 'L\'œil du photographe',
      description: 'Observez, cherchez les détails, photographiez. Chaque cliché vous rapproche du trésor caché.',
      difficulty: 'medium',
      duration: 60,
      points: 380,
    },
    stepsHint: [
      'Façade principale — photographier le détail indiqué',
      'Jardin intérieur — photo du banc historique',
      'Entrée secondaire — scanner le QR code',
    ],
  },
  {
    id: 'family-adventure',
    name: 'Aventure en famille',
    description: 'Parcours ludique et accessible, conçu pour être joué en famille avec des enfants. Énigmes simples et découvertes amusantes.',
    icon: '👨‍👩‍👧',
    defaults: {
      title: 'La grande chasse en famille',
      description: 'Une aventure pour toute la famille ! Résolvez les énigmes ensemble et trouvez le trésor caché.',
      difficulty: 'easy',
      duration: 40,
      points: 200,
    },
    stepsHint: [
      'Entrée — trouver le premier indice sur le panneau',
      'Fontaine ou point d\'eau — quiz facile',
      'Aire de jeux ou jardin — valider par GPS',
      'Arrivée — récompense finale !',
    ],
  },
];
