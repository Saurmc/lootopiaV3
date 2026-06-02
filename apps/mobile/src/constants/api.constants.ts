import { Platform } from 'react-native';

// EXPO_PUBLIC_API_URL permet de surcharger l'URL en dev sur device réel.
// Ex: EXPO_PUBLIC_API_URL=http://192.168.1.14:3000 npx expo run:ios --device
const envUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  envUrl ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
