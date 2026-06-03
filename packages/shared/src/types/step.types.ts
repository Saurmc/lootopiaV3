export type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo' | 'ar';

export type ArContent2DOverlay = { type: '2d-overlay'; image: string };
export type ArContentQROverlay = { type: 'qr-overlay'; qr_trigger: string; image: string };
export type ArContent = ArContent2DOverlay | ArContentQROverlay | null;

export interface Step {
  id: string;
  huntId: string;
  title: string;
  description: string | null;
  validationRadius: number;
  validationType: ValidationType;
  arContent: ArContent;
}
