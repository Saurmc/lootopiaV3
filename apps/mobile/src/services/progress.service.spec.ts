import { progressService } from './progress.service';

jest.mock('./api', () => ({
  api: {
    get: jest.fn(),
  },
}));

import { api } from './api';

const mockGet = api.get as jest.Mock;

const mockProgressMap = {
  progress_id: 'prog-1',
  hunt_id: 'hunt-1',
  current_step: 1,
  completed_steps: [0],
  total_points: 50,
  started_at: '2026-05-01T10:00:00Z',
  completed_at: null,
  steps: [
    {
      id: 'step-1',
      order: 0,
      title: 'Étape 1',
      description: null,
      status: 'completed' as const,
      validation_radius: 50,
      validation_type: 'gps',
      coordinates: { lat: 48.85, lng: 2.35 },
    },
    {
      id: 'step-2',
      order: 1,
      title: 'Étape 2',
      description: 'Trouver le trésor',
      status: 'current' as const,
      validation_radius: 30,
      validation_type: 'qrcode',
      coordinates: { lat: 48.86, lng: 2.36 },
    },
    {
      id: 'step-3',
      order: 2,
      title: 'Étape 3',
      description: null,
      status: 'locked' as const,
      validation_radius: 20,
      validation_type: 'gps',
      coordinates: null,
    },
  ],
};

describe('progressService.getHuntProgress', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns ProgressMap on success', async () => {
    mockGet.mockResolvedValueOnce({ data: mockProgressMap });

    const result = await progressService.getHuntProgress('hunt-1');

    expect(mockGet).toHaveBeenCalledWith('/hunts/hunt-1/progress');
    expect(result).toEqual(mockProgressMap);
    expect(result.steps).toHaveLength(3);
    expect(result.steps[1].status).toBe('current');
  });

  it('propagates axios 404 error', async () => {
    const error = { response: { status: 404 } };
    mockGet.mockRejectedValueOnce(error);

    await expect(progressService.getHuntProgress('hunt-999')).rejects.toEqual(error);
  });
});
