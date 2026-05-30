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
import { stepsService } from './steps.service';

const HUNT_ID = 'hunt-1';
const STEP_ID = 'step-1';

const mockStep = {
  id: STEP_ID,
  hunt_id: HUNT_ID,
  order: 0,
  title: 'Devant la fontaine',
  description: 'Rendez-vous à la fontaine centrale',
  validation_radius: 50,
  ar_content: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('stepsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('retourne la liste des étapes', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockStep] });
      const result = await stepsService.getAll(HUNT_ID);
      expect(api.get).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/steps`);
      expect(result).toEqual([mockStep]);
    });
  });

  describe('create', () => {
    it('crée une étape et retourne le résultat', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockStep });
      const payload = { order: 0, title: 'Devant la fontaine', validation_radius: 50 };
      const result = await stepsService.create(HUNT_ID, payload);
      expect(api.post).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/steps`, payload);
      expect(result).toEqual(mockStep);
    });

    it('transmet ar_content sans transformation', async () => {
      const arContent = {
        type: '2d-overlay' as const,
        image: 'https://cdn.example.com/img.png',
        position: { x: 1, y: 0, z: 0 },
        scale: 0.8,
      };
      const stepWithAr = { ...mockStep, ar_content: arContent };
      vi.mocked(api.post).mockResolvedValueOnce({ data: stepWithAr });
      const payload = { order: 0, title: 'Avec AR', validation_radius: 50, ar_content: arContent };
      const result = await stepsService.create(HUNT_ID, payload);
      expect(api.post).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/steps`, payload);
      expect(result.ar_content).toEqual(arContent);
    });
  });

  describe('update', () => {
    it('met à jour une étape', async () => {
      const updated = { ...mockStep, title: 'Nouveau titre' };
      vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });
      const result = await stepsService.update(HUNT_ID, STEP_ID, { title: 'Nouveau titre' });
      expect(api.patch).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/steps/${STEP_ID}`, { title: 'Nouveau titre' });
      expect(result.title).toBe('Nouveau titre');
    });
  });

  describe('remove', () => {
    it('appelle DELETE sur le bon endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined });
      await stepsService.remove(HUNT_ID, STEP_ID);
      expect(api.delete).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/steps/${STEP_ID}`);
    });
  });
});
