import { api } from './api';

export interface StepDto {
  id: string;
  hunt_id: string;
  order: number;
  title: string;
  description: string | null;
  validation_radius: number;
  ar_content: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateStepPayload {
  order: number;
  title: string;
  description?: string;
  lat?: number;
  lng?: number;
  validation_radius: number;
  ar_content?: Record<string, unknown> | null;
}

export type UpdateStepPayload = Partial<CreateStepPayload>;

export const stepsService = {
  async getAll(huntId: string): Promise<StepDto[]> {
    const res = await api.get<StepDto[]>(`/hunts/${huntId}/steps`);
    return res.data;
  },

  async create(huntId: string, payload: CreateStepPayload): Promise<StepDto> {
    const res = await api.post<StepDto>(`/hunts/${huntId}/steps`, payload);
    return res.data;
  },

  async update(huntId: string, stepId: string, payload: UpdateStepPayload): Promise<StepDto> {
    const res = await api.patch<StepDto>(`/hunts/${huntId}/steps/${stepId}`, payload);
    return res.data;
  },

  async remove(huntId: string, stepId: string): Promise<void> {
    await api.delete(`/hunts/${huntId}/steps/${stepId}`);
  },
};
