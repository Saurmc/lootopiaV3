import { api } from './api';

export interface AdminStats {
  user_count: number;
  partner_count: number;
  player_count: number;
  hunt_count: number;
  active_hunt_count: number;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
}

export interface Partner {
  id: string;
  email: string | null;
  pseudo: string | null;
  hunt_count: number;
  active_hunt_count: number;
  created_at: string;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },

  getPartners: async (): Promise<Partner[]> => {
    const { data } = await api.get<Partner[]>('/admin/partners');
    return data;
  },
};
