import { api } from './api';

export interface AuthResponse {
  access_token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, pseudo: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password, pseudo });
    return response.data;
  },

  loginAsGuest: async (deviceToken: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/guest', { device_token: deviceToken });
    return response.data;
  },

  convertAccount: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.patch<AuthResponse>('/auth/convert', { email, password });
    return response.data;
  },
};
