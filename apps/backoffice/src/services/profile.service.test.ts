import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: { get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from './api';
import { profileService } from './profile.service';

const mockProfile = {
  id: 'p1',
  email: 'partner@example.com',
  role: 'PARTNER',
  display_name: 'Mon Enseigne',
  description: 'Une belle description.',
  logo_url: 'https://cdn.example.com/logo.png',
};

describe('profileService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getMe', () => {
    it('retourne le profil courant', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockProfile });
      const result = await profileService.getMe();
      expect(api.get).toHaveBeenCalledWith('/me/profile');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('envoie le patch et retourne le profil mis à jour', async () => {
      const updated = { ...mockProfile, display_name: 'Nouveau nom' };
      vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });
      const result = await profileService.updateProfile({ display_name: 'Nouveau nom' });
      expect(api.patch).toHaveBeenCalledWith('/me/profile', { display_name: 'Nouveau nom' });
      expect(result.display_name).toBe('Nouveau nom');
    });
  });

  describe('updatePassword', () => {
    it('envoie la requête de changement de mot de passe', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({ data: undefined });
      await profileService.updatePassword({
        current_password: 'OldPass1',
        new_password: 'NewPass1',
      });
      expect(api.patch).toHaveBeenCalledWith('/me/password', {
        current_password: 'OldPass1',
        new_password: 'NewPass1',
      });
    });
  });

  describe('deleteAccount', () => {
    it('envoie la requête de suppression', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({});
      await profileService.deleteAccount();
      expect(api.delete).toHaveBeenCalledWith('/me');
    });
  });
});
