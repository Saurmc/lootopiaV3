import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { UsersRepository } from '../users/users.repository';
import { StepsRepository } from '../steps/steps.repository';
import { GeoService } from '../geo/geo.service';
import { BadgesService } from '../badges/badges.service';
import { ProgressEntity } from './entities/progress.entity';
import { HuntEntity } from '../hunts/entities/hunt.entity';
import { StepEntity } from '../steps/entities/step.entity';
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
  device_token: null,
  is_guest: false,
  consent_gps: false,
  pseudo: null,
  avatar_url: null,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const mockStep = (overrides: Partial<StepEntity> = {}): StepEntity => ({
  id: 'step-uuid',
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  order: 0,
  title: 'Étape 1',
  description: null,
  location: { type: 'Point', coordinates: [2.3522, 48.8566] },
  validation_radius: 50,
  validation_type: 'gps',
  ar_content: null,
  created_at: new Date(),
  ...overrides,
});

describe('ProgressService', () => {
  let service: ProgressService;
  let progressRepo: jest.Mocked<ProgressRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;
  let usersRepo: jest.Mocked<UsersRepository>;
  let stepsRepo: jest.Mocked<StepsRepository>;
  let geoService: jest.Mocked<GeoService>;
  let badgesService: jest.Mocked<BadgesService>;

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

    stepsRepo = {
      findById: jest.fn(),
      findByHuntId: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<StepsRepository>;

    geoService = {
      isWithinRadius: jest.fn(),
      findHuntsNearby: jest.fn(),
    } as unknown as jest.Mocked<GeoService>;

    badgesService = {
      getUserBadges: jest.fn(),
      hasBadge: jest.fn(),
      awardBadge: jest.fn(),
      checkAndAwardHuntBadges: jest.fn(),
    } as unknown as jest.Mocked<BadgesService>;

    service = new ProgressService(progressRepo, huntsRepo, usersRepo, stepsRepo, geoService, badgesService);
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
    const makeStep = (order: number) => ({
      id: `step-${order}`,
      hunt_id: 'hunt-uuid',
      hunt: undefined as any,
      order,
      title: `Étape ${order}`,
      description: null,
      location: null,
      validation_radius: 50,
      validation_type: 'gps',
      ar_content: null,
      created_at: new Date(),
    });

    it('should return step statuses correctly', async () => {
      const progress = mockProgress();
      progress.current_step = 2;
      progress.completed_steps = [1];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      huntsRepo.findByIdWithSteps.mockResolvedValue(
        mockHunt({ steps: [makeStep(1), makeStep(2), makeStep(3)] }),
      );
      usersRepo.findById.mockResolvedValue(mockUser({ consent_gps: false }));

      const result = await service.getProgressWithSteps('user-uuid', 'hunt-uuid');

      expect(result.steps[0].status).toBe('completed');
      expect(result.steps[1].status).toBe('current');
      expect(result.steps[2].status).toBe('locked');
    });

    it('should expose validation_type and description in step map', async () => {
      const progress = mockProgress();
      progress.current_step = 0;
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      huntsRepo.findByIdWithSteps.mockResolvedValue(
        mockHunt({ steps: [{ ...makeStep(0), validation_type: 'quiz', description: 'Question ?' }] }),
      );
      usersRepo.findById.mockResolvedValue(mockUser());

      const result = await service.getProgressWithSteps('user-uuid', 'hunt-uuid');

      expect(result.steps[0].validation_type).toBe('quiz');
      expect(result.steps[0].description).toBe('Question ?');
    });

    it('should hide coordinates on locked steps regardless of GPS consent', async () => {
      const progress = mockProgress();
      progress.current_step = 1;
      progress.completed_steps = [];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      huntsRepo.findByIdWithSteps.mockResolvedValue(
        mockHunt({ steps: [makeStep(1), makeStep(2)] }),
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

  describe('validateStep — GPS', () => {
    it('should validate GPS step and update progress', async () => {
      const progress = mockProgress();
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({ validation_type: 'gps' }));
      geoService.isWithinRadius.mockResolvedValue(true);
      huntsRepo.findByIdWithSteps.mockResolvedValue(mockHunt({ steps: [mockStep()] as any }));
      progressRepo.findAllByUser.mockResolvedValue([]);
      progressRepo.save.mockResolvedValue({
        ...progress,
        completed_steps: [0],
        current_step: 1,
        total_points: 100,
        completed_at: new Date(),
      });

      const result = await service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', {
        lat: 48.8566,
        lng: 2.3522,
      });

      expect(progressRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ completed_steps: [0], current_step: 1 }),
      );
      expect(result.completed_steps).toContain(0);
    });

    it('should throw BadRequestException when GPS coords missing for GPS step', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({ validation_type: 'gps' }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when player is out of radius', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({ validation_type: 'gps' }));
      geoService.isWithinRadius.mockResolvedValue(false);

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { lat: 0, lng: 0 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateStep — QR Code', () => {
    it('should validate qrcode step with correct code', async () => {
      const progress = mockProgress();
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({
        validation_type: 'qrcode',
        location: null,
        ar_content: { expected_code: 'SECRET123' },
      }));
      huntsRepo.findByIdWithSteps.mockResolvedValue(mockHunt({ steps: [mockStep()] as any }));
      progressRepo.findAllByUser.mockResolvedValue([]);
      progressRepo.save.mockResolvedValue({ ...progress, completed_steps: [0], current_step: 1, total_points: 0, completed_at: new Date() });

      await service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { qr_code: 'SECRET123' });

      expect(progressRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException with wrong QR code', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({
        validation_type: 'qrcode',
        location: null,
        ar_content: { expected_code: 'SECRET123' },
      }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { qr_code: 'WRONG' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when qr_code missing', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({
        validation_type: 'qrcode',
        location: null,
        ar_content: { expected_code: 'SECRET123' },
      }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateStep — Quiz', () => {
    it('should validate quiz step with correct answer (case insensitive)', async () => {
      const progress = mockProgress();
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({
        validation_type: 'quiz',
        location: null,
        ar_content: { answer: 'Paris' },
      }));
      huntsRepo.findByIdWithSteps.mockResolvedValue(mockHunt({ steps: [mockStep()] as any }));
      progressRepo.findAllByUser.mockResolvedValue([]);
      progressRepo.save.mockResolvedValue({ ...progress, completed_steps: [0], current_step: 1, total_points: 0, completed_at: new Date() });

      await service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { answer: 'paris' });

      expect(progressRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException with wrong answer', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({
        validation_type: 'quiz',
        location: null,
        ar_content: { answer: 'Paris' },
      }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { answer: 'Lyon' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateStep — Photo', () => {
    it('should validate photo step when file_url provided', async () => {
      const progress = mockProgress();
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({ validation_type: 'photo', location: null }));
      huntsRepo.findByIdWithSteps.mockResolvedValue(mockHunt({ steps: [mockStep()] as any }));
      progressRepo.findAllByUser.mockResolvedValue([]);
      progressRepo.save.mockResolvedValue({ ...progress, completed_steps: [0], current_step: 1, total_points: 0, completed_at: new Date() });

      await service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', {
        file_url: '/uploads/photo.jpg',
      });

      expect(progressRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when file_url missing', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(mockProgress());
      stepsRepo.findById.mockResolvedValue(mockStep({ validation_type: 'photo', location: null }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateStep — common guards', () => {
    it('should throw ConflictException when step already validated', async () => {
      const progress = mockProgress();
      progress.completed_steps = [0];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({ order: 0 }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { lat: 48.8, lng: 2.3 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when step is not the current step', async () => {
      const progress = mockProgress();
      progress.current_step = 2;
      progress.completed_steps = [0, 1];
      progressRepo.findByUserAndHunt.mockResolvedValue(progress);
      stepsRepo.findById.mockResolvedValue(mockStep({ order: 3 }));

      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { lat: 48.8, lng: 2.3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no progress found', async () => {
      progressRepo.findByUserAndHunt.mockResolvedValue(null);
      await expect(
        service.validateStep('user-uuid', 'hunt-uuid', 'step-uuid', { lat: 48.8, lng: 2.3 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
