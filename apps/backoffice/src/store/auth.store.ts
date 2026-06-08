import { create } from 'zustand';
import { Role } from '@lootopia/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
  clearAuth: () => set({ token: null, refreshToken: null, user: null }),
}));
