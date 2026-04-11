import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  api: { get: vi.fn() },
}));

import { api } from './api';
import { statsService } from './stats.service';

const HUNT_ID = 'hunt-1';

const mockStats = {
  hunt_id: HUNT_ID,
  participant_count: 12,
  completed_count: 5,
  completion_rate: 42,
  average_points: 120,
};

const mockParticipants = [
  {
    user_id: 'u1',
    email: 'player@example.com',
    current_step: 2,
    completed_steps: [0, 1],
    total_points: 80,
    started_at: '2026-01-01T00:00:00Z',
    completed_at: null,
  },
];

describe('statsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getHuntStats', () => {
    it('retourne les stats d\'une chasse', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockStats });
      const result = await statsService.getHuntStats(HUNT_ID);
      expect(api.get).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/stats`);
      expect(result).toEqual(mockStats);
    });
  });

  describe('getHuntParticipants', () => {
    it('retourne la liste des participants', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockParticipants });
      const result = await statsService.getHuntParticipants(HUNT_ID);
      expect(api.get).toHaveBeenCalledWith(`/hunts/${HUNT_ID}/participants`);
      expect(result).toEqual(mockParticipants);
    });

    it('retourne un tableau vide si aucun participant', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
      const result = await statsService.getHuntParticipants(HUNT_ID);
      expect(result).toHaveLength(0);
    });
  });
});
