export interface Progress {
  id: string;
  userId: string;
  huntId: string;
  currentStep: number;
  completedSteps: number[];
  totalPoints: number;
}

export type StepStatus = 'completed' | 'current' | 'locked';

export interface StepMapItem {
  id: string;
  order: number;
  title: string;
  description: string | null;
  status: StepStatus;
  validation_radius: number;
  validation_type: string;
  coordinates: { lat: number; lng: number } | null;
}

export interface ProgressMap {
  progress_id: string;
  hunt_id: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: string;
  completed_at: string | null;
  steps: StepMapItem[];
}
