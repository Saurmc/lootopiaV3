import { api } from './api';

export interface HuntDto {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  location: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  duration: number | null;
  points: number;
  is_active: boolean;
  created_at: string;
  step_count?: number;
  image_url?: string | null;
}

export interface HuntTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration: number;
  points: number;
}

export interface CreateHuntPayload {
  title: string;
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: number;
  points?: number;
  is_active?: boolean;
  plan_url?: string;
}

export type UpdateHuntPayload = Partial<CreateHuntPayload>;

export const huntsService = {
  getAll: async (q?: string): Promise<HuntDto[]> => {
    const params = q ? { q } : {};
    const { data } = await api.get<HuntDto[]>('/hunts', { params });
    return data;
  },

  getById: async (id: string): Promise<HuntDto> => {
    const { data } = await api.get<HuntDto>(`/hunts/${id}`);
    return data;
  },

  create: async (payload: CreateHuntPayload): Promise<HuntDto> => {
    const { data } = await api.post<HuntDto>('/hunts', payload);
    return data;
  },

  update: async (id: string, payload: UpdateHuntPayload): Promise<HuntDto> => {
    const { data } = await api.patch<HuntDto>(`/hunts/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/hunts/${id}`);
  },

  getTemplates: async (): Promise<HuntTemplate[]> => {
    const { data } = await api.get<HuntTemplate[]>('/hunts/templates');
    return data;
  },

  createFromTemplate: async (templateId: string): Promise<HuntDto> => {
    const { data } = await api.post<HuntDto>(`/hunts/from-template/${templateId}`);
    return data;
  },
};
