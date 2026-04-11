import { api } from './api';

export type ZoneShapeType = 'rect' | 'circle' | 'polygon';

export interface ZoneShape {
  type: ZoneShapeType;
  // rect
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // circle
  cx?: number;
  cy?: number;
  radius?: number;
  // polygon
  points?: [number, number][];
}

export interface ZoneDto {
  id: string;
  hunt_id: string;
  label: string | null;
  shape: ZoneShape;
  order: number;
  created_at: string;
}

export interface CreateZonePayload {
  label?: string;
  shape: ZoneShape;
  order?: number;
}

export type UpdateZonePayload = Partial<CreateZonePayload>;

export const zonesService = {
  async getAll(huntId: string): Promise<ZoneDto[]> {
    const res = await api.get<ZoneDto[]>(`/hunts/${huntId}/zones`);
    return res.data;
  },

  async create(huntId: string, payload: CreateZonePayload): Promise<ZoneDto> {
    const res = await api.post<ZoneDto>(`/hunts/${huntId}/zones`, payload);
    return res.data;
  },

  async update(huntId: string, zoneId: string, payload: UpdateZonePayload): Promise<ZoneDto> {
    const res = await api.patch<ZoneDto>(`/hunts/${huntId}/zones/${zoneId}`, payload);
    return res.data;
  },

  async remove(huntId: string, zoneId: string): Promise<void> {
    await api.delete(`/hunts/${huntId}/zones/${zoneId}`);
  },
};
