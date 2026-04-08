import { NotFoundException } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';
import { HuntEntity } from './entities/hunt.entity';

const mockHunt = (overrides: Partial<HuntEntity> = {}): HuntEntity => ({
  id: 'hunt-uuid',
  partner_id: 'partner-uuid',
  partner: undefined as any,
  title: 'Chasse du trésor',
  description: 'Une belle chasse',
  location: 'Paris',
  difficulty: 'medium',
  duration: 60,
  points: 100,
  is_active: true,
  steps: [],
  created_at: new Date(),
  ...overrides,
});

describe('HuntsService', () => {
  let service: HuntsService;
  let repo: jest.Mocked<HuntsRepository>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    service = new HuntsService(repo);
  });

  describe('findAll', () => {
    it('should return list of active hunts', async () => {
      repo.findAll.mockResolvedValue([mockHunt(), mockHunt({ id: 'hunt-2' })]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(repo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no hunts', async () => {
      repo.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return hunt when found', async () => {
      repo.findById.mockResolvedValue(mockHunt());
      const result = await service.findById('hunt-uuid');
      expect(result.id).toBe('hunt-uuid');
    });

    it('should throw NotFoundException when hunt not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
