import { ProfileService } from './profile.service';
import { ProgressRepository } from '../progress/progress.repository';
import { BadgesService } from '../badges/badges.service';
import { ProgressEntity } from '../progress/entities/progress.entity';
import { BadgeEntity } from '../badges/entities/badge.entity';

const mockProgress = (overrides: Partial<ProgressEntity> = {}): ProgressEntity => ({
  id: 'progress-uuid',
  user_id: 'user-uuid',
  user: undefined as any,
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  current_step: 2,
  completed_steps: [0, 1],
  total_points: 50,
  started_at: new Date(),
  completed_at: new Date(),
  ...overrides,
});

describe('ProfileService', () => {
  let service: ProfileService;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let badgesService: jest.Mocked<BadgesService>;

  beforeEach(() => {
    progressRepo = {
      findAllByUser: jest.fn(),
    } as unknown as jest.Mocked<ProgressRepository>;

    badgesService = {
      getUserBadges: jest.fn(),
    } as unknown as jest.Mocked<BadgesService>;

    service = new ProfileService(progressRepo, badgesService);
  });

  describe('getStats', () => {
    it('should aggregate stats correctly', async () => {
      progressRepo.findAllByUser.mockResolvedValue([
        mockProgress({ total_points: 100, completed_at: new Date() }),
        mockProgress({ total_points: 50, completed_at: null }),
      ]);
      badgesService.getUserBadges.mockResolvedValue([
        { id: 'b1', user_id: 'user-uuid', user: undefined as any, badge_type: 'hunt_completed', earned_at: new Date() },
      ] as BadgeEntity[]);

      const result = await service.getStats('user-uuid');

      expect(result.total_points).toBe(150);
      expect(result.hunt_count).toBe(2);
      expect(result.completed_hunts).toBe(1);
      expect(result.badge_count).toBe(1);
    });

    it('should return zeros when no progress or badges', async () => {
      progressRepo.findAllByUser.mockResolvedValue([]);
      badgesService.getUserBadges.mockResolvedValue([]);

      const result = await service.getStats('user-uuid');

      expect(result.total_points).toBe(0);
      expect(result.hunt_count).toBe(0);
      expect(result.completed_hunts).toBe(0);
      expect(result.badge_count).toBe(0);
    });
  });

  describe('getActiveProgresses', () => {
    it('should return only non-completed progresses', async () => {
      progressRepo.findAllByUser.mockResolvedValue([
        mockProgress({ hunt_id: 'hunt-1', completed_at: null }),
        mockProgress({ hunt_id: 'hunt-2', completed_at: new Date() }),
      ]);

      const result = await service.getActiveProgresses('user-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].hunt_id).toBe('hunt-1');
      expect('completed_at' in result[0]).toBe(false);
    });

    it('should return empty array when all hunts are completed', async () => {
      progressRepo.findAllByUser.mockResolvedValue([
        mockProgress({ completed_at: new Date() }),
      ]);

      const result = await service.getActiveProgresses('user-uuid');

      expect(result).toHaveLength(0);
    });
  });

  describe('getHuntHistory', () => {
    it('should return mapped hunt history', async () => {
      progressRepo.findAllByUser.mockResolvedValue([
        mockProgress({ hunt_id: 'hunt-1', total_points: 30 }),
        mockProgress({ hunt_id: 'hunt-2', total_points: 70, completed_at: null }),
      ]);

      const result = await service.getHuntHistory('user-uuid');

      expect(result).toHaveLength(2);
      expect(result[0].hunt_id).toBe('hunt-1');
      expect(result[1].completed_at).toBeNull();
    });
  });
});
