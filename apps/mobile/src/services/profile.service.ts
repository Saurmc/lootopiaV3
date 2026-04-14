import { api } from './api';

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

export const profileService = {
  /** GET /me/profile */
  fetchProfile: async (): Promise<PlayerProfile> => {
    const res = await api.get<PlayerProfile>('/me/profile');
    return res.data;
  },

  /** GET /me/stats */
  fetchStats: async (): Promise<PlayerStats> => {
    const res = await api.get<PlayerStats>('/me/stats');
    return res.data;
  },
};
