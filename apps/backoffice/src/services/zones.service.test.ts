import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from './api';
import { zonesService } from './zones.service';

const HUNT_ID = 'hunt-1';
const ZONE_ID = 'zone-1';

const mockZone = {
  id: ZONE_ID,
  hunt_id: HUNT_ID,
  label: 'Entrée',
  shape: { type: 'rect' as const, x: 10, y: 20, width: 100, height: 80 },
  order: 0,
  created_at: '2026-01-01T00:00:00Z',
};

describe('zonesService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('retourne la liste des zones', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockZone] });
      const result = await zonesService.getAll(HUNT_ID);
      expect(api.get).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/zones`);
      expect(result).toEqual([mockZone]);
    });
  });

  describe('create', () => {
    it('crée une zone rect et retourne le résultat', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockZone });
      const payload = { label: 'Entrée', shape: { type: 'rect' as const, x: 10, y: 20, width: 100, height: 80 } };
      const result = await zonesService.create(HUNT_ID, payload);
      expect(api.post).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/zones`, payload);
      expect(result).toEqual(mockZone);
    });

    it('crée une zone circle', async () => {
      const circleZone = { ...mockZone, shape: { type: 'circle' as const, cx: 50, cy: 50, radius: 30 } };
      vi.mocked(api.post).mockResolvedValueOnce({ data: circleZone });
      const result = await zonesService.create(HUNT_ID, { shape: { type: 'circle', cx: 50, cy: 50, radius: 30 } });
      expect(result.shape.type).toBe('circle');
    });
  });

  describe('update', () => {
    it('met à jour une zone', async () => {
      const updated = { ...mockZone, label: 'Sortie' };
      vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });
      const result = await zonesService.update(HUNT_ID, ZONE_ID, { label: 'Sortie' });
      expect(api.patch).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/zones/${ZONE_ID}`, { label: 'Sortie' });
      expect(result.label).toBe('Sortie');
    });
  });

  describe('remove', () => {
    it('appelle DELETE sur le bon endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined });
      await zonesService.remove(HUNT_ID, ZONE_ID);
      expect(api.delete).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/zones/${ZONE_ID}`);
    });
  });
});
