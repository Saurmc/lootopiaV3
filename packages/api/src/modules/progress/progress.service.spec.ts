import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ProgressEntity } from './entities/progress.entity';
import { HuntEntity } from '../hunts/entities/hunt.entity';

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

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;

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

    service = new ProgressService(progressRepo, huntsRepo);
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
});
