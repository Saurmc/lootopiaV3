import { BadgesService, BadgeType } from './badges.service';
import { BadgesRepository } from './badges.repository';
import { BadgeEntity } from './entities/badge.entity';

const mockBadge = (type: string): BadgeEntity => ({
  id: 'badge-uuid',
  user_id: 'user-uuid',
  user: undefined as any,
  badge_type: type,
  earned_at: new Date(),
});

describe('BadgesService', () => {
  let service: BadgesService;
  let repo: jest.Mocked<BadgesRepository>;

  beforeEach(() => {
    repo = {
      findByUser: jest.fn(),
      findByUserAndType: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<BadgesRepository>;

    service = new BadgesService(repo);
  });

  describe('getUserBadges', () => {
    it('should return user badges', async () => {
      repo.findByUser.mockResolvedValue([mockBadge(BadgeType.HUNT_COMPLETED)]);
      const result = await service.getUserBadges('user-uuid');
      expect(result).toHaveLength(1);
      expect(result[0].badge_type).toBe(BadgeType.HUNT_COMPLETED);
    });
  });

  describe('hasBadge', () => {
    it('should return true when badge exists', async () => {
      repo.findByUserAndType.mockResolvedValue(mockBadge(BadgeType.HUNT_COMPLETED));
      expect(await service.hasBadge('user-uuid', BadgeType.HUNT_COMPLETED)).toBe(true);
    });

    it('should return false when badge does not exist', async () => {
      repo.findByUserAndType.mockResolvedValue(null);
      expect(await service.hasBadge('user-uuid', BadgeType.HUNT_COMPLETED)).toBe(false);
    });
  });

  describe('awardBadge', () => {
    it('should save and return badge when not already owned', async () => {
      repo.findByUserAndType.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockBadge(BadgeType.HUNT_COMPLETED));

      const result = await service.awardBadge('user-uuid', BadgeType.HUNT_COMPLETED);

      expect(repo.save).toHaveBeenCalledWith({
        user_id: 'user-uuid',
        badge_type: BadgeType.HUNT_COMPLETED,
      });
      expect(result).not.toBeNull();
    });

    it('should return null when badge already owned', async () => {
      repo.findByUserAndType.mockResolvedValue(mockBadge(BadgeType.HUNT_COMPLETED));

      const result = await service.awardBadge('user-uuid', BadgeType.HUNT_COMPLETED);

      expect(repo.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('checkAndAwardHuntBadges', () => {
    it('should award hunt_completed badge on any hunt completion', async () => {
      repo.findByUserAndType.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockBadge(BadgeType.HUNT_COMPLETED));

      await service.checkAndAwardHuntBadges('user-uuid', 2);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ badge_type: BadgeType.HUNT_COMPLETED }),
      );
    });

    it('should award first_hunt badge on first hunt completion', async () => {
      repo.findByUserAndType.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockBadge(BadgeType.FIRST_HUNT));

      await service.checkAndAwardHuntBadges('user-uuid', 1);

      const calls = repo.save.mock.calls.map((c) => c[0].badge_type);
      expect(calls).toContain(BadgeType.HUNT_COMPLETED);
      expect(calls).toContain(BadgeType.FIRST_HUNT);
    });

    it('should not award first_hunt badge on subsequent completions', async () => {
      repo.findByUserAndType.mockResolvedValue(null);
      repo.save.mockResolvedValue(mockBadge(BadgeType.HUNT_COMPLETED));

      await service.checkAndAwardHuntBadges('user-uuid', 3);

      const calls = repo.save.mock.calls.map((c) => c[0].badge_type);
      expect(calls).not.toContain(BadgeType.FIRST_HUNT);
    });
  });
});
