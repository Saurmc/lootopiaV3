export type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo' | 'ar';

export interface ARContent {
  type: string;
  payload: Record<string, unknown>;
}

export interface ArContent3DSpatial {
  type: 'ar-3d-spatial';
  marker_image: string;
  artwork_image?: string;
  model_url?: string;
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
