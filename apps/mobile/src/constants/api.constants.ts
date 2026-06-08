import Constants from "expo-constants";
import { Platform } from "react-native";

// hostUri = "<ip-de-la-machine-de-dev>:8081" — fourni par Metro, toujours synchronisé
// avec le réseau actif (évite de coder l'IP en dur, qui change à chaque changement de réseau)
const devServerHost = Constants.expoConfig?.hostUri?.split(":")[0];

// Sur l'émulateur Android, localhost de la machine hôte est accessible via 10.0.2.2
// Sur iOS (simulateur ou vrai appareil), localhost fonctionne directement
export const API_BASE_URL = devServerHost
  ? `http://${devServerHost}:3000`
  : Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://10.1.60.57:3000"; // fallback — IP machine dev (mise à jour si réseau change)
