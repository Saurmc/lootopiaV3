import { AdminService } from './admin.service';
import { UsersRepository } from '../users/users.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressRepository } from '../progress/progress.repository';
import { UserEntity } from '../users/entities/user.entity';
import { ProgressEntity } from '../progress/entities/progress.entity';
import { Role } from '../../common/enums/role.enum';

const mockUser = (id: string): UserEntity => ({
  id,
  email: `${id}@test.com`,
  password_hash: 'hash',
  role: Role.PLAYER,
  consent_gps: false,
  created_at: new Date(),
  updated_at: new Date(),
});

const mockProgress = (completed: boolean): ProgressEntity => ({
  id: 'p-uuid',
  user_id: 'user-uuid',
  user: undefined as any,
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  current_step: 1,
  completed_steps: [0],
  total_points: 50,
  started_at: new Date(),
  completed_at: completed ? new Date() : null,
});

describe('AdminService', () => {
  let service: AdminService;
  let usersRepo: jest.Mocked<UsersRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;
  let progressRepo: jest.Mocked<ProgressRepository>;

  beforeEach(() => {
    usersRepo = { findAll: jest.fn() } as unknown as jest.Mocked<UsersRepository>;
    huntsRepo = { count: jest.fn() } as unknown as jest.Mocked<HuntsRepository>;
    progressRepo = { findAll: jest.fn() } as unknown as jest.Mocked<ProgressRepository>;

    service = new AdminService(usersRepo, huntsRepo, progressRepo);
  });

  describe('getGlobalStats', () => {
    it('should return correct aggregated stats', async () => {
      usersRepo.findAll.mockResolvedValue([mockUser('u1'), mockUser('u2'), mockUser('u3')]);
      huntsRepo.count.mockResolvedValue(5);
      progressRepo.findAll.mockResolvedValue([
        mockProgress(true),
        mockProgress(true),
        mockProgress(false),
      ]);

      const result = await service.getGlobalStats();

      expect(result.user_count).toBe(3);
      expect(result.hunt_count).toBe(5);
      expect(result.participant_count).toBe(3);
      expect(result.completed_count).toBe(2);
      expect(result.completion_rate).toBe(67);
    });

    it('should return zeros when no data', async () => {
      usersRepo.findAll.mockResolvedValue([]);
      huntsRepo.count.mockResolvedValue(0);
      progressRepo.findAll.mockResolvedValue([]);

      const result = await service.getGlobalStats();

      expect(result.user_count).toBe(0);
      expect(result.hunt_count).toBe(0);
      expect(result.participant_count).toBe(0);
      expect(result.completion_rate).toBe(0);
    });

    it('should return 100% completion rate when all progresses completed', async () => {
      usersRepo.findAll.mockResolvedValue([mockUser('u1')]);
      huntsRepo.count.mockResolvedValue(1);
      progressRepo.findAll.mockResolvedValue([mockProgress(true), mockProgress(true)]);

      const result = await service.getGlobalStats();

      expect(result.completion_rate).toBe(100);
    });
  });
});
