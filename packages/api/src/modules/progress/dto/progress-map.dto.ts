export type StepStatus = 'completed' | 'current' | 'locked';

export class StepMapDto {
  id: string;
  order: number;
  title: string;
  description: string | null;
  status: StepStatus;
  validation_radius: number;
  // Type de validation exposé pour que le mobile sache quelle UI afficher
  validation_type: string;
  // Coordonnées exposées uniquement pour les étapes complétées et l'étape courante
  // Étapes verrouillées n'exposent pas leur position (RGPD + gameplay)
  coordinates: { lat: number; lng: number } | null;
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
