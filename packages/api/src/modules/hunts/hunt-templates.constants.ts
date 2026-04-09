export interface HuntTemplate {
  id: string;
  name: string;
  description: string;
  defaults: {
    title: string;
    description: string;
    difficulty: string;
    duration: number;
    points: number;
  };
}

export const HUNT_TEMPLATES: HuntTemplate[] = [
  {
    id: 'urban-explorer',
    name: 'Explorateur urbain',
    description: 'Parcours découverte en ville, idéal pour les débutants.',
    defaults: {
      title: 'Chasse urbaine',
      description: 'Partez à la découverte des trésors cachés de la ville.',
      difficulty: 'easy',
      duration: 60,
      points: 100,
    },
  },
  {
    id: 'history-trail',
    name: 'Sentier historique',
    description: 'Voyage dans le temps à travers les monuments et lieux historiques.',
    defaults: {
      title: 'Circuit historique',
      description: 'Suivez les traces du passé et découvrez l\'histoire de la région.',
      difficulty: 'medium',
      duration: 90,
      points: 200,
    },
  },
  {
    id: 'nature-challenge',
    name: 'Défi nature',
    description: 'Aventure sportive en plein air pour les amateurs de sensations.',
    defaults: {
      title: 'Chasse en nature',
      description: 'Affrontez les éléments et trouvez les indices cachés dans la nature.',
      difficulty: 'hard',
      duration: 120,
      points: 350,
    },
  },
  {
    id: 'family-fun',
    name: 'Aventure en famille',
    description: 'Parcours ludique adapté aux familles avec enfants.',
    defaults: {
      title: 'Chasse en famille',
      description: 'Une aventure amusante pour petits et grands !',
      difficulty: 'easy',
      duration: 45,
      points: 80,
    },
  },
];
