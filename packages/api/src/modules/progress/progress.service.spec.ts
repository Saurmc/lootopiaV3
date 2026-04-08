import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { UsersRepository } from '../users/users.repository';
import { ProgressEntity } from './entities/progress.entity';
import { HuntEntity } from '../hunts/entities/hunt.entity';
import { UserEntity } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

const mockHunt = (overrides: Partial<HuntEntity> = {}): HuntEntity => ({
  id: 'hunt-uuid',
  partner_id: 'partner-uuid',
  partner: undefined as any,
  title: 'Chasse test',
  description: null,
  location: null,
  coordinates: null,
  difficulty: null,
  duration: null,
  points: 100,
  is_active: true,
  steps: [],
  created_at: new Date(),
  ...overrides,
});

const mockProgress = (): ProgressEntity => ({
  id: 'progress-uuid',
  user_id: 'user-uuid',
  user: undefined as any,
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  current_step: 0,
  completed_steps: [],
  total_points: 0,
  started_at: new Date(),
  completed_at: null,
});

const mockUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-uuid',
  email: 'test@test.com',
  password_hash: 'hash',
  role: Role.PLAYER,
  consent_gps: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    progressRepo = {
      findByUserAndHunt: jest.fn(),
      findAllByUser: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ProgressRepository>;

    huntsRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByIdWithSteps: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    usersRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
      updateConsentGps: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new ProgressService(progressRepo, huntsRepo, usersRepo);
  });

  describe('joinHunt', () => {
    it('should create progress when hunt exists and not already joined', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      progressRepo.findByUserAndHunt.mockResolvedValue(null);
      progressRepo.save.mockResolvedValue(mockProgress());

      const result = await service.joinHunt('user-uuid', 'hunt-uuid');

      expect(progressRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid',
          hunt_id: 'hunt-uuid',
          current_step: 0,
          completed_steps: [],
          total_points: 0,
        }),
      );
      expect(result.id).toBe('progress-uuid');
    });

    it('should throw NotFoundException when hunt not found', async () => {
      huntsRepo.findById.mockResolvedValue(null);
      await expect(service.joinHunt('user-uuid', 'unknown')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when hunt is inactive', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ is_active: false }));
      await expect(service.joinHunt('user-uuid', 'hunt-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when already joined', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());

      await expect(service.joinHunt('user-uuid', 'hunt-uuid')).rejects.toThrow(ConflictException);
    });
  });

  describe('getProgress', () => {
    it('should return progress when found', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      const result = await service.getProgress('user-uuid', 'hunt-uuid');
      expect(result.id).toBe('progress-uuid');
    });

    it('should throw NotFoundException when no progress found', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(null);
      await expect(service.getProgress('user-uuid', 'hunt-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProgressWithSteps', () => {
    const mockStep = (order: number) => ({
      id: `step-${order}`,
      hunt_id: 'hunt-uuid',
      hunt: undefined as any,
      order,
      title: `Étape ${order}`,
      description: null,
      location: null,
      validation_radius: 50,
      ar_content: null,
      created_at: new Date(),
    });

    it('should return step statuses correctly', async () => {
      const progress = mockProgress();
      progress.current_step = 2;
      progress.completed_steps = [1];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      huntsRepo.findByIdWithSteps.mockResolvedValue(
        mockHunt({ steps: [mockStep(1), mockStep(2), mockStep(3)] }),
      );
      usersRepo.findById.mockResolvedValue(mockUser({ consent_gps: false }));

      const result = await service.getProgressWithSteps('user-uuid', 'hunt-uuid');

      expect(result.steps[0].status).toBe('completed');
      expect(result.steps[1].status).toBe('current');
      expect(result.steps[2].status).toBe('locked');
    });

    it('should hide coordinates on locked steps regardless of GPS consent', async () => {
      const progress = mockProgress();
      progress.current_step = 1;
      progress.completed_steps = [];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      huntsRepo.findByIdWithSteps.mockResolvedValue(
        mockHunt({ steps: [mockStep(1), mockStep(2)] }),
      );
      usersRepo.findById.mockResolvedValue(mockUser({ consent_gps: true }));

      const result = await service.getProgressWithSteps('user-uuid', 'hunt-uuid');

      expect(result.steps[1].status).toBe('locked');
      expect(result.steps[1].coordinates).toBeNull();
    });

    it('should throw NotFoundException when no progress exists', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(null);
      await expect(
        service.getProgressWithSteps('user-uuid', 'hunt-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
