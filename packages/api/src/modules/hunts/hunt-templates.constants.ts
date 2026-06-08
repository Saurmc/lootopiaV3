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
    name: 'Musée des Beaux-Arts',
    description: 'Chasse en intérieur dans un musée. Les joueurs scannent les œuvres exposées pour faire apparaître des informations en réalité augmentée.',
    icon: '🎨',
    defaults: {
      title: 'À la découverte des chefs-d\'œuvre',
      description: 'Partez à la découverte des trésors du musée. Scannez les œuvres et laissez-les vous révéler leurs secrets !',
      difficulty: 'easy',
      duration: 45,
      points: 300,
    },
    stepsHint: [
      'Grande galerie — scanner le tableau principal',
      'Salle des impressionnistes — scanner l\'œuvre phare',
      'Galerie temporaire — scanner l\'affiche de l\'exposition',
    ],
  },
  {
    id: 'heritage-ar',
    name: 'Patrimoine historique',
    description: 'Visite guidée d\'un château, d\'une cathédrale ou d\'un site classé. Les joueurs scannent les éléments du patrimoine pour découvrir leur histoire.',
    icon: '🏰',
    defaults: {
      title: 'Les secrets du patrimoine',
      description: 'Explorez ce lieu chargé d\'histoire. Scannez chaque élément pour percer ses mystères et gagner des points.',
      difficulty: 'medium',
      duration: 60,
      points: 400,
    },
    stepsHint: [
      'Entrée principale — scanner le blason ou le portail',
      'Grande salle / nef — scanner l\'élément central',
      'Tour ou donjon — scanner la plaque commémorative',
      'Jardins ou cour — scanner la sculpture finale',
    ],
  },
  {
    id: 'science-ar',
    name: 'Musée des Sciences',
    description: 'Chasse interactive dans un musée scientifique ou une exposition. Les joueurs scannent les maquettes et installations pour débloquer des explications en AR.',
    icon: '🔬',
    defaults: {
      title: 'Expédition scientifique',
      description: 'Devenez explorateur scientifique ! Scannez les expositions pour percer les mystères de la science.',
      difficulty: 'medium',
      duration: 50,
      points: 350,
    },
    stepsHint: [
      'Hall d\'entrée — scanner la maquette principale',
      'Espace interactif — scanner l\'installation',
      'Salle dédiée — scanner le panneau de l\'expérience',
    ],
  },
  {
    id: 'family-ar',
    name: 'Aventure en famille',
    description: 'Parcours ludique adapté aux familles avec enfants. Énigmes simples autour d\'œuvres ou d\'objets à scanner ensemble.',
    icon: '👨‍👩‍👧',
    defaults: {
      title: 'La grande chasse en famille',
      description: 'Une aventure pour toute la famille ! Scannez les indices ensemble et trouvez le trésor caché.',
      difficulty: 'easy',
      duration: 40,
      points: 200,
    },
    stepsHint: [
      'Accueil — scanner le panneau de bienvenue',
      'Salle principale — scanner l\'objet mystère',
      'Espace enfants — scanner le personnage mascotte',
      'Sortie — scanner le trésor final !',
    ],
  },
];
