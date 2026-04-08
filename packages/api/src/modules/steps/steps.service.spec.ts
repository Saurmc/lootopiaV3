import { NotFoundException } from '@nestjs/common';
import { StepsService } from './steps.service';
import { StepsRepository } from './steps.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { StepEntity } from './entities/step.entity';
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

const mockStep = (overrides: Partial<StepEntity> = {}): StepEntity => ({
  id: 'step-uuid',
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  order: 0,
  title: 'Étape 1',
  description: null,
  location: null,
  validation_radius: 50,
  ar_content: null,
  created_at: new Date(),
  ...overrides,
});

describe('StepsService', () => {
  let service: StepsService;
  let stepsRepo: jest.Mocked<StepsRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;

  beforeEach(() => {
    stepsRepo = {
      findById: jest.fn(),
      findByHuntId: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<StepsRepository>;

    huntsRepo = {
      findById: jest.fn(),
      findByIdWithSteps: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    service = new StepsService(stepsRepo, huntsRepo);
  });

  describe('findByHunt', () => {
    it('should return steps ordered by order', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.findByHuntId.mockResolvedValue([mockStep({ order: 0 }), mockStep({ order: 1, id: 'step-2' })]);

      const result = await service.findByHunt('hunt-uuid');
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when hunt not found', async () => {
      huntsRepo.findById.mockResolvedValue(null);
      await expect(service.findByHunt('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createStep', () => {
    it('should create step with minimal fields', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.save.mockResolvedValue(mockStep());

      await service.createStep('hunt-uuid', 'partner-uuid', { order: 0, title: 'Étape 1' });

      expect(stepsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          hunt_id: 'hunt-uuid',
          order: 0,
          title: 'Étape 1',
          location: null,
          validation_radius: 50,
        }),
      );
    });

    it('should build GeoJSON location when lat/lng provided', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.save.mockResolvedValue(mockStep());

      await service.createStep('hunt-uuid', 'partner-uuid', {
        order: 0,
        title: 'Étape GPS',
        lat: 48.8566,
        lng: 2.3522,
      });

      expect(stepsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          location: { type: 'Point', coordinates: [2.3522, 48.8566] },
        }),
      );
    });

    it('should throw NotFoundException when partner does not own hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ partner_id: 'other-partner' }));
      await expect(
        service.createStep('hunt-uuid', 'partner-uuid', { order: 0, title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStep', () => {
    it('should update step fields', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.findById.mockResolvedValue(mockStep());
      stepsRepo.save.mockResolvedValue(mockStep({ title: 'Modifié' }));

      const result = await service.updateStep('hunt-uuid', 'step-uuid', 'partner-uuid', {
        title: 'Modifié',
      });

      expect(stepsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'step-uuid', title: 'Modifié' }),
      );
      expect(result.title).toBe('Modifié');
    });

    it('should throw NotFoundException when step not found in hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateStep('hunt-uuid', 'unknown-step', 'partner-uuid', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStep', () => {
    it('should delete step when owner calls it', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.findById.mockResolvedValue(mockStep());
      stepsRepo.deleteById.mockResolvedValue(undefined);

      await service.deleteStep('hunt-uuid', 'step-uuid', 'partner-uuid');

      expect(stepsRepo.deleteById).toHaveBeenCalledWith('step-uuid');
    });

    it('should throw NotFoundException when step not found', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      stepsRepo.findById.mockResolvedValue(null);

      await expect(
        service.deleteStep('hunt-uuid', 'unknown-step', 'partner-uuid'),
      ).rejects.toThrow(NotFoundException);
      expect(stepsRepo.deleteById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when partner does not own hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ partner_id: 'other-partner' }));

      await expect(
        service.deleteStep('hunt-uuid', 'step-uuid', 'partner-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
