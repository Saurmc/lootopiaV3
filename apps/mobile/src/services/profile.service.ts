import { api } from './api';
import { API_BASE_URL } from '../constants/api.constants';

export interface PlayerBadge {
  id: string;
  badge_type: string;
  earned_at: string;
}

export interface PlayerProfile {
  id: string;
  email: string | null;
  pseudo: string | null;
  avatar_url: string | null;
  role: string;
  is_guest: boolean;
  consent_gps: boolean;
  created_at: string;
}

export interface PlayerStats {
  total_points: number;
  hunt_count: number;
  completed_hunts: number;
  badge_count: number;
}

export interface UpdateProfilePayload {
  pseudo?: string;
  avatar_url?: string;
}

export const profileService = {
  /** GET /me/profile */
  fetchProfile: async (): Promise<PlayerProfile> => {
    const res = await api.get<PlayerProfile>('/me/profile');
    return res.data;
  },

  /** PATCH /me/profile */
  updateProfile: async (payload: UpdateProfilePayload): Promise<PlayerProfile> => {
    const res = await api.patch<PlayerProfile>('/me/profile', payload);
    return res.data;
  },

  /** GET /me/stats */
  fetchStats: async (): Promise<PlayerStats> => {
    const res = await api.get<PlayerStats>('/me/stats');
    return res.data;
  },

  /** GET /me/badges */
  fetchBadges: async (): Promise<PlayerBadge[]> => {
    const res = await api.get<PlayerBadge[]>('/me/badges');
    return res.data;
  },

  /** POST /files/upload — upload avatar, retourne { key, presignedUrl } */
  uploadAvatar: async (localUri: string, mimeType: string): Promise<{ key: string; presignedUrl: string }> => {
    const form = new FormData();
    const filename = localUri.split('/').pop() ?? 'avatar.jpg';
    form.append('file', { uri: localUri, name: filename, type: mimeType } as unknown as Blob);
    const res = await api.post<{ key: string; presignedUrl: string }>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { key: res.data.key, presignedUrl: res.data.presignedUrl };
  },

  /** PATCH /me/password */
  changePassword: async (currentPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> => {
    await api.patch('/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },

  /** DELETE /me */
  deleteAccount: async (): Promise<void> => {
    await api.delete('/me');
  },
};
