import { api } from './api';

export interface HuntStatsDto {
  hunt_id: string;
  participant_count: number;
  completed_count: number;
  completion_rate: number;
  average_points: number;
}

export interface ParticipantDto {
  user_id: string;
  email: string;
  current_step: number;
  completed_steps: number[];
  total_points: number;
  started_at: string;
  completed_at: string | null;
}

export const statsService = {
  async getHuntStats(huntId: string): Promise<HuntStatsDto> {
    const res = await api.get<HuntStatsDto>(`/hunts/${huntId}/stats`);
    return res.data;
  },

  async getHuntParticipants(huntId: string): Promise<ParticipantDto[]> {
    const res = await api.get<ParticipantDto[]>(`/hunts/${huntId}/participants`);
    return res.data;
  },
};
