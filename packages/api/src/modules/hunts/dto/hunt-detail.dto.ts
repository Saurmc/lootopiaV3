export class StepSummaryDto {
  id: string;
  order: number;
  title: string;
  description: string | null;
  validation_radius: number;
  // ar_content exposé pour l'affichage mobile
  ar_content: Record<string, unknown> | null;
  // Coordonnées GPS omises ici — exposées uniquement lors de la validation
  // de proximité (US11) pour éviter de révéler la position exacte à l'avance
}

export class HuntDetailDto {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: string | null;
  duration: number | null;
  points: number;
  is_active: boolean;
  image_url: string | null;
  steps: StepSummaryDto[];
  step_count: number;
  created_at: Date;
}
