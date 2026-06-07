export type ValidationType = 'gps' | 'qrcode' | 'quiz' | 'photo' | 'ar';

export type ArContent2DOverlay = { type: '2d-overlay'; image: string };
export type ArContentQROverlay = { type: 'qr-overlay'; qr_trigger: string; image: string };
export type ArContent3DSpatial = {
  type: 'ar-3d-spatial';
  /** Oeuvre 2D : image imprimée scannée par ARKit ImageTracking */
  marker_image?: string;
  /** Oeuvre 3D (statue…) : fichier .arobject pré-scanné par ARKit ObjectTracking */
  object_scan?: string;
  /** Modèle 3D à afficher en AR quand le marqueur est détecté */
  model_url?: string;
  model_type?: 'GLTF' | 'OBJ' | 'VRX';
};
export type ArContent = ArContent2DOverlay | ArContentQROverlay | ArContent3DSpatial | null;

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
  arContent: ArContent;
}
