import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/auth.service';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../services/api';

export const DEVICE_TOKEN_KEY = 'lootopia_device_token';
export const CONSENT_GPS_KEY = 'lootopia_consent_gps';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface AuthUser {
  id: string;
  role: string;
  email: string | null;
  is_guest: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  consentGps: boolean | null;
  pendingGpsConsent: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, pseudo: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  convertAccount: (email: string, password: string) => Promise<void>;
  setConsentGps: (consent: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** @internal */
  _setToken: (token: string, refreshToken: string, isGuest?: boolean) => Promise<void>;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  consentGps: null,
  pendingGpsConsent: false,

  initialize: async () => {
    try {
      const [token, consentRaw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        AsyncStorage.getItem(CONSENT_GPS_KEY),
      ]);
      if (token) {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        await get()._setToken(token, refreshToken ?? '', false);
      }
      if (consentRaw !== null) {
        set({ consentGps: consentRaw === 'true' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  _setToken: async (token: string, refreshToken: string, isGuest = false) => {
    const [, consentRaw] = await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      AsyncStorage.getItem(CONSENT_GPS_KEY),
    ]);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
    const payload = decodeJwtPayload(token);
    const guestFromPayload =
      typeof payload.is_guest === 'boolean' ? payload.is_guest : isGuest;
    set({
      token,
      user: {
        id: payload.sub as string,
        role: payload.role as string,
        email: (payload.email as string | null) ?? null,
        is_guest: guestFromPayload,
      },
      isAuthenticated: true,
      isGuest: guestFromPayload,
      isLoading: false,
      consentGps: consentRaw !== null ? consentRaw === 'true' : null,
    });
  },

  login: async (email: string, password: string) => {
    const { access_token, refresh_token } = await authService.login(email, password);
    await get()._setToken(access_token, refresh_token, false);
  },

  register: async (email: string, password: string, pseudo: string) => {
    const { access_token, refresh_token } = await authService.register(email, password, pseudo);
    await get()._setToken(access_token, refresh_token, false);
  },

  loginAsGuest: async () => {
    let deviceToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (!deviceToken) {
      deviceToken = generateUUID();
      await AsyncStorage.setItem(DEVICE_TOKEN_KEY, deviceToken);
    }
    const { access_token, refresh_token } = await authService.loginAsGuest(deviceToken);
    await get()._setToken(access_token, refresh_token, true);
    set({ pendingGpsConsent: true });
  },

  convertAccount: async (email: string, password: string) => {
    const { access_token, refresh_token } = await authService.convertAccount(email, password);
    await get()._setToken(access_token, refresh_token, false);
  },

  setConsentGps: async (consent: boolean) => {
    await AsyncStorage.setItem(CONSENT_GPS_KEY, String(consent));
    set({ consentGps: consent, pendingGpsConsent: false });
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isGuest: false,
      pendingGpsConsent: false,
      // consentGps intentionally not reset — it's a device-level preference
    });
  },
}));
