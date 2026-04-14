import { Platform } from 'react-native';

// Sur l'émulateur Android, localhost de la machine hôte est accessible via 10.0.2.2
// Sur iOS (simulateur ou vrai appareil), localhost fonctionne directement
export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
