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
import { huntsService } from './hunts.service';

// Réponse brute de l'API (image_url)
const mockHunt = {
  id: 'hunt-1',
  partner_id: 'user-1',
  title: 'Test Hunt',
  description: 'A test hunt',
  location: 'Paris',
  difficulty: 'easy' as const,
  duration: 60,
  points: 100,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  image_url: null,
};

// DTO exposé côté backoffice (plan_url)
const expectedHunt = {
  id: 'hunt-1',
  partner_id: 'user-1',
  title: 'Test Hunt',
  description: 'A test hunt',
  location: 'Paris',
  difficulty: 'easy' as const,
  duration: 60,
  points: 100,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  plan_url: null,
};

describe('huntsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('retourne la liste des chasses', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [mockHunt] });
      const result = await huntsService.getAll();
      expect(api.get).toHaveBeenCalledWith('/hunts', { params: {} });
      expect(result).toEqual([expectedHunt]);
    });

    it('passe le paramètre q si fourni', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
      await huntsService.getAll('paris');
      expect(api.get).toHaveBeenCalledWith('/hunts', { params: { q: 'paris' } });
    });
  });

  describe('create', () => {
    it('crée une chasse et retourne le résultat', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockHunt });
      const result = await huntsService.create({ title: 'Test Hunt', is_active: false });
      expect(api.post).toHaveBeenCalledWith('/hunts', { title: 'Test Hunt', is_active: false });
      expect(result).toEqual(expectedHunt);
    });
  });

  describe('update', () => {
    it('met à jour une chasse', async () => {
      const updated = { ...mockHunt, title: 'Updated' };
      vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });
      const result = await huntsService.update('hunt-1', { title: 'Updated' });
      expect(api.patch).toHaveBeenCalledWith('/hunts/hunt-1', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('appelle DELETE sur le bon endpoint', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined });
      await huntsService.remove('hunt-1');
      expect(api.delete).toHaveBeenCalledWith('/hunts/hunt-1');
    });
  });

  describe('getTemplates', () => {
    it('retourne les templates', async () => {
      const templates = [{ id: 'urban-explorer', title: 'Urban Explorer', description: '', difficulty: 'medium', duration: 60, points: 100 }];
      vi.mocked(api.get).mockResolvedValueOnce({ data: templates });
      const result = await huntsService.getTemplates();
      expect(api.get).toHaveBeenCalledWith('/hunts/templates');
      expect(result).toEqual(templates);
    });
  });

  describe('createFromTemplate', () => {
    it('crée une chasse depuis un template', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockHunt });
      const result = await huntsService.createFromTemplate('urban-explorer');
      expect(api.post).toHaveBeenCalledWith('/hunts/from-template/urban-explorer');
      expect(result).toEqual(expectedHunt);
    });
  });
});
