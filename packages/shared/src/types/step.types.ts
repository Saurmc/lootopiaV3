export type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo';

export interface ARContent {
  type: string;
  payload: Record<string, unknown>;
}

export interface Step {
  id: string;
  huntId: string;
  title: string;
  description: string | null;
  validationRadius: number;
  validationType: ValidationType;
  arContent: ARContent | null;
}
