export type StepStatus = 'completed' | 'current' | 'locked';

export class StepMapDto {
  id: string;
  order: number;
  title: string;
  status: StepStatus;
  validation_radius: number;
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
