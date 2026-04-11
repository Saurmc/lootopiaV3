import { api } from './api';

export interface ProfileDto {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  description: string | null;
  logo_url: string | null;
}

export interface UpdateProfilePayload {
  display_name?: string;
  description?: string;
  logo_url?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
}

export const profileService = {
  async getMe(): Promise<ProfileDto> {
    const { data } = await api.get<ProfileDto>('/me/profile');
    return data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ProfileDto> {
    const { data } = await api.patch<ProfileDto>('/me/profile', payload);
    return data;
  },

  async updatePassword(payload: UpdatePasswordPayload): Promise<void> {
    await api.patch('/me/password', payload);
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/me');
  },
};
