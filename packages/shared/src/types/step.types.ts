export type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo';

export interface ARContent {
  type: '2d-overlay' | '3d-model';
  image?: string;
  model_url?: string;
  position?: { x: number; y: number; z: number };
  scale?: number;
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
