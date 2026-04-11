import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from './api';
import { filesService } from './files.service';

const mockResponse = {
  url: '/uploads/abc123.png',
  filename: 'abc123.png',
  originalname: 'photo.png',
  mimetype: 'image/png',
  size: 204800,
};

describe('filesService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('upload', () => {
    it('envoie un FormData en multipart et retourne le résultat', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });
      const file = new File(['content'], 'photo.png', { type: 'image/png' });

      const result = await filesService.upload(file);

      expect(api.post).toHaveBeenCalledTimes(1);
      const [url, body, config] = vi.mocked(api.post).mock.calls[0];
      expect(url).toBe('/files/upload');
      expect(body).toBeInstanceOf(FormData);
      expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
      expect(result).toEqual(mockResponse);
    });

    it('propage les erreurs de l\'API', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));
      const file = new File(['content'], 'photo.png', { type: 'image/png' });
      await expect(filesService.upload(file)).rejects.toThrow('Network error');
    });
  });

  describe('getFileUrl', () => {
    it('retourne l\'URL complète si relative', () => {
      const url = filesService.getFileUrl('/uploads/abc123.png');
      expect(url).toContain('/uploads/abc123.png');
    });

    it('retourne l\'URL telle quelle si absolue', () => {
      const abs = 'https://cdn.example.com/file.png';
      expect(filesService.getFileUrl(abs)).toBe(abs);
    });
  });
});
