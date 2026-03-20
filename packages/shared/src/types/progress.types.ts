export interface Progress {
  id: string;
  userId: string;
  huntId: string;
  currentStep: number;
  completedSteps: number[];
  totalPoints: number;
}
