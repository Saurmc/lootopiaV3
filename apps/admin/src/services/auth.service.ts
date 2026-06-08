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

function extractApiMessage(err: unknown): string {
  const apiMsg = (err as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (Array.isArray(apiMsg)) return apiMsg[0] ?? '';
  return apiMsg ?? '';
}

export const authService = {
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
      const decoded = decodeJwt(data.access_token);
      if (decoded.role !== Role.ADMIN) {
        throw new Error('not_admin');
      }
      return {
        token: data.access_token,
        user: { id: decoded.sub, role: decoded.role, email },
      };
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'not_admin') throw err;
      const apiMsg = extractApiMessage(err);
      throw new Error(apiMsg || 'Invalid credentials');
    }
  },
};
