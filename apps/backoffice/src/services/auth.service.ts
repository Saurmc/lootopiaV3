import { Role } from '@lootopia/shared';
import { api } from './api';
import type { AuthUser } from '../store/auth.store';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPartnerPayload {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}

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
  login: async (payload: LoginPayload): Promise<{ token: string; user: AuthUser }> => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', payload);
      const decoded = decodeJwt(data.access_token);
      const user: AuthUser = {
        id: decoded.sub,
        role: decoded.role,
        email: payload.email,
      };
      return { token: data.access_token, user };
    } catch (err: unknown) {
      const apiMsg = extractApiMessage(err);
      throw new Error(apiMsg || 'Invalid credentials');
    }
  },

  registerPartner: async (payload: RegisterPartnerPayload): Promise<void> => {
    await api.post('/auth/register/partner', payload);
  },
};
