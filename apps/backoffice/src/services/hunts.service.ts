import { api } from './api';
import { filesService } from './files.service';

interface RawHuntDto {
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
  coordinates?: { type: string; coordinates: [number, number] } | null;
}

export interface HuntDto extends Omit<RawHuntDto, 'image_url' | 'coordinates'> {
  plan_url?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface HuntTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  stepsHint?: string[];
  defaults: {
    title: string;
    description: string;
    difficulty: string;
    duration: number;
    points: number;
  };
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

function fromRaw(raw: RawHuntDto): HuntDto {
  const { image_url, coordinates, ...rest } = raw;
  const [lng, lat] = coordinates?.coordinates ?? [];
  return {
    ...rest,
    plan_url: image_url ? filesService.getFileUrl(image_url) : null,
    lat: typeof lat === 'number' ? lat : null,
    lng: typeof lng === 'number' ? lng : null,
  };
}

function toApiPayload(payload: Partial<CreateHuntPayload>): Omit<Partial<CreateHuntPayload>, 'plan_url'> & { image_url?: string } {
  const { plan_url, ...rest } = payload;
  return { ...rest, ...(plan_url !== undefined ? { image_url: plan_url } : {}) };
}

export const huntsService = {
  getAll: async (q?: string): Promise<HuntDto[]> => {
    const params = q ? { q } : {};
    const { data } = await api.get<RawHuntDto[]>('/hunts', { params });
    return data.map(fromRaw);
  },

  getById: async (id: string): Promise<HuntDto> => {
    const { data } = await api.get<RawHuntDto>(`/hunts/${id}`);
    return fromRaw(data);
  },

  create: async (payload: CreateHuntPayload): Promise<HuntDto> => {
    const { data } = await api.post<RawHuntDto>('/hunts', toApiPayload(payload));
    return fromRaw(data);
  },

  update: async (id: string, payload: UpdateHuntPayload): Promise<HuntDto> => {
    const { data } = await api.patch<RawHuntDto>(`/hunts/${id}`, toApiPayload(payload));
    return fromRaw(data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/hunts/${id}`);
  },

  getTemplates: async (): Promise<HuntTemplate[]> => {
    const { data } = await api.get<HuntTemplate[]>('/hunts/templates');
    return data;
  },

  createFromTemplate: async (templateId: string): Promise<HuntDto> => {
    const { data } = await api.post<RawHuntDto>(`/hunts/from-template/${templateId}`);
    return fromRaw(data);
  },
};
