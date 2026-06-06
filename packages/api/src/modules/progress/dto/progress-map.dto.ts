export type StepStatus = 'completed' | 'current' | 'locked';

export class StepMapDto {
  id: string;
  order: number;
  title: string;
  description: string | null;
  status: StepStatus;
  validation_radius: number;
  validation_type: string;
  coordinates: { lat: number; lng: number } | null;
  // Vignette visuelle toujours exposée (tous statuts) pour l'affichage dans la grille
  thumbnail: string | null;
  // Contenu AR complet exposé uniquement pour les étapes courantes/complétées
  ar_content: Record<string, unknown> | null;
}

export class ProgressMapDto {
  progress_id: string;
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: Date;
  completed_at: Date | null;
  steps: StepMapDto[];
}
