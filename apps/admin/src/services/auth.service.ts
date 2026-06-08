import { Role } from '@lootopia/shared';
import { api } from './api';
import type { AuthUser } from '../store/auth.store';

interface LoginResponse {
  access_token: string;
}

interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

function decodeJwt(token: string): JwtPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
  return JSON.parse(jsonPayload) as JwtPayload;
}

export const authService = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    const decoded = decodeJwt(data.access_token);
    if (decoded.role !== Role.ADMIN) {
      throw new Error('Accès réservé aux administrateurs.');
    }
    return {
      token: data.access_token,
      user: { id: decoded.sub, role: decoded.role, email },
    };
  },
};
