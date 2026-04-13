import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { TOKEN_KEY } from '../services/api';

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

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** @internal */
  _setToken: (token: string, isGuest?: boolean) => Promise<void>;
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

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        await get()._setToken(token);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  _setToken: async (token: string, isGuest = false) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    const payload = decodeJwtPayload(token);
    set({
      token,
      user: {
        id: payload.sub as string,
        role: payload.role as string,
        email: null,
        is_guest: isGuest,
      },
      isAuthenticated: true,
      isGuest,
      isLoading: false,
    });
  },

  login: async (email: string, password: string) => {
    const { access_token } = await authService.login(email, password);
    await get()._setToken(access_token, false);
  },

  register: async (email: string, password: string) => {
    const { access_token } = await authService.register(email, password);
    await get()._setToken(access_token, false);
  },

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false, isGuest: false });
  },
}));
