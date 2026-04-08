import { StatsService } from './stats.service';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressRepository } from '../progress/progress.repository';
import { HuntEntity } from '../hunts/entities/hunt.entity';
import { ProgressEntity } from '../progress/entities/progress.entity';
import { Role } from '../../common/enums/role.enum';

const mockHunt = (id: string, partnerId: string): HuntEntity => ({
  id,
  partner_id: partnerId,
  partner: undefined as any,
  title: `Chasse ${id}`,
  description: null,
  location: null,
  coordinates: null,
  difficulty: null,
  duration: null,
  points: 100,
  is_active: true,
  steps: [],
  created_at: new Date(),
});

const mockProgress = (huntId: string, completed: boolean, points = 50): ProgressEntity => ({
  id: 'p-uuid',
  user_id: 'user-uuid',
  user: undefined as any,
  hunt_id: huntId,
  hunt: undefined as any,
  current_step: 1,
  completed_steps: [0],
  total_points: points,
  started_at: new Date(),
  completed_at: completed ? new Date() : null,
});

describe('StatsService', () => {
  let service: StatsService;
  let huntsRepo: jest.Mocked<HuntsRepository>;
  let progressRepo: jest.Mocked<ProgressRepository>;

  beforeEach(() => {
    huntsRepo = {
      findAllForStats: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    progressRepo = {
      findAllByHunt: jest.fn(),
    } as unknown as jest.Mocked<ProgressRepository>;

    service = new StatsService(huntsRepo, progressRepo);
  });

  describe('getHuntsStats', () => {
    it('should filter by partnerId when role is PARTNER', async () => {
      huntsRepo.findAllForStats.mockResolvedValue([mockHunt('hunt-1', 'partner-uuid')]);
      progressRepo.findAllByHunt.mockResolvedValue([
        mockProgress('hunt-1', true, 80),
        mockProgress('hunt-1', false, 20),
      ]);

      await service.getHuntsStats('partner-uuid', Role.PARTNER);

      expect(huntsRepo.findAllForStats).toHaveBeenCalledWith('partner-uuid');
    });

    it('should not filter when role is ADMIN', async () => {
      huntsRepo.findAllForStats.mockResolvedValue([]);

      await service.getHuntsStats('admin-uuid', Role.ADMIN);

      expect(huntsRepo.findAllForStats).toHaveBeenCalledWith(undefined);
    });

    it('should return correct stats per hunt', async () => {
      huntsRepo.findAllForStats.mockResolvedValue([mockHunt('hunt-1', 'partner-uuid')]);
      progressRepo.findAllByHunt.mockResolvedValue([
        mockProgress('hunt-1', true, 100),
        mockProgress('hunt-1', true, 60),
        mockProgress('hunt-1', false, 0),
      ]);

      const result = await service.getHuntsStats('partner-uuid', Role.PARTNER);

      expect(result).toHaveLength(1);
      expect(result[0].participant_count).toBe(3);
      expect(result[0].completed_count).toBe(2);
      expect(result[0].completion_rate).toBe(67);
      expect(result[0].average_points).toBe(53);
    });

    it('should return zeros for hunt with no participants', async () => {
      huntsRepo.findAllForStats.mockResolvedValue([mockHunt('hunt-1', 'partner-uuid')]);
      progressRepo.findAllByHunt.mockResolvedValue([]);

      const result = await service.getHuntsStats('partner-uuid', Role.PARTNER);

      expect(result[0].participant_count).toBe(0);
      expect(result[0].completion_rate).toBe(0);
      expect(result[0].average_points).toBe(0);
    });
  });
});
