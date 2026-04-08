import { NotFoundException } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { HuntsRepository } from './hunts.repository';
import { GeoService } from '../geo/geo.service';
import { HuntEntity } from './entities/hunt.entity';

const mockHunt = (overrides: Partial<HuntEntity> = {}): HuntEntity => ({
  id: 'hunt-uuid',
  partner_id: 'partner-uuid',
  partner: undefined as any,
  title: 'Chasse du trésor',
  description: 'Une belle chasse',
  location: 'Paris',
  coordinates: null,
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
  let geoService: jest.Mocked<GeoService>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    geoService = {
      findHuntsNearby: jest.fn(),
    } as unknown as jest.Mocked<GeoService>;

    service = new HuntsService(repo, geoService);
  });

  describe('findAll', () => {
    it('should return list of active hunts', async () => {
      repo.findAll.mockResolvedValue([mockHunt(), mockHunt({ id: 'hunt-2' })]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no hunts', async () => {
      repo.findAll.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
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

  describe('search', () => {
    it('should delegate to repository with query string', async () => {
      repo.search.mockResolvedValue([mockHunt()]);
      const result = await service.search('trésor');
      expect(repo.search).toHaveBeenCalledWith('trésor');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no match', async () => {
      repo.search.mockResolvedValue([]);
      const result = await service.search('xxxxxx');
      expect(result).toEqual([]);
    });
  });

  describe('findNearby', () => {
    it('should delegate to GeoService with provided coordinates', async () => {
      geoService.findHuntsNearby.mockResolvedValue([]);
      await service.findNearby(48.8566, 2.3522, 3000);
      expect(geoService.findHuntsNearby).toHaveBeenCalledWith(48.8566, 2.3522, 3000);
    });

    it('should use default radius when not specified', async () => {
      geoService.findHuntsNearby.mockResolvedValue([]);
      await service.findNearby(48.8566, 2.3522);
      expect(geoService.findHuntsNearby).toHaveBeenCalledWith(48.8566, 2.3522, 5000);
    });
  });
});
