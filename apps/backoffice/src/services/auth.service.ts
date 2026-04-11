import { Role } from '@lootopia/shared';
import { api } from './api';
import type { AuthUser } from '../store/auth.store';

export interface LoginPayload {
  email: string;
  password: string;
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

export const authService = {
  login: async (payload: LoginPayload): Promise<{ token: string; user: AuthUser }> => {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    const decoded = decodeJwt(data.access_token);
    const user: AuthUser = {
      id: decoded.sub,
      role: decoded.role,
      email: payload.email,
    };
    return { token: data.access_token, user };
  },
};
