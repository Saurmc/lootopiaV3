import { create } from 'zustand';
import { Role } from '@lootopia/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));
