import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZonesRepository } from './zones.repository';
import { HuntsRepository } from '../hunts/hunts.repository';
import { ZoneEntity, ZoneShape } from './entities/zone.entity';
import { HuntEntity } from '../hunts/entities/hunt.entity';

const mockShape: ZoneShape = { type: 'rect', x: 10, y: 10, width: 100, height: 50 };

const mockHunt = (overrides: Partial<HuntEntity> = {}): HuntEntity => ({
  id: 'hunt-uuid',
  partner_id: 'partner-uuid',
  partner: undefined as any,
  title: 'Chasse test',
  description: null,
  location: null,
  coordinates: null,
  difficulty: 'easy',
  duration: 30,
  points: 50,
  is_active: true,
  steps: [],
  created_at: new Date(),
  ...overrides,
});

const mockZone = (overrides: Partial<ZoneEntity> = {}): ZoneEntity => ({
  id: 'zone-uuid',
  hunt_id: 'hunt-uuid',
  hunt: undefined as any,
  label: 'Zone A',
  shape: mockShape,
  order: 0,
  created_at: new Date(),
  ...overrides,
});

describe('ZonesService', () => {
  let service: ZonesService;
  let zonesRepo: jest.Mocked<ZonesRepository>;
  let huntsRepo: jest.Mocked<HuntsRepository>;

  beforeEach(() => {
    zonesRepo = {
      findByHunt: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<ZonesRepository>;

    huntsRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<HuntsRepository>;

    service = new ZonesService(zonesRepo, huntsRepo);
  });

  describe('findByHunt', () => {
    it('should return all zones for a hunt', async () => {
      zonesRepo.findByHunt.mockResolvedValue([mockZone(), mockZone({ id: 'zone-2' })]);
      const result = await service.findByHunt('hunt-uuid');
      expect(result).toHaveLength(2);
      expect(zonesRepo.findByHunt).toHaveBeenCalledWith('hunt-uuid');
    });

    it('should return empty array when no zones', async () => {
      zonesRepo.findByHunt.mockResolvedValue([]);
      expect(await service.findByHunt('hunt-uuid')).toEqual([]);
    });
  });

  describe('createZone', () => {
    it('should create a zone when partner owns the hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.save.mockResolvedValue(mockZone());

      const result = await service.createZone('hunt-uuid', 'partner-uuid', {
        label: 'Zone A',
        shape: mockShape,
        order: 0,
      });

      expect(zonesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          hunt_id: 'hunt-uuid',
          label: 'Zone A',
          shape: mockShape,
          order: 0,
        }),
      );
      expect(result.id).toBe('zone-uuid');
    });

    it('should default order to 0 when not provided', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.save.mockResolvedValue(mockZone());

      await service.createZone('hunt-uuid', 'partner-uuid', { shape: mockShape });

      expect(zonesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0, label: null }),
      );
    });

    it('should throw NotFoundException when hunt not found', async () => {
      huntsRepo.findById.mockResolvedValue(null);
      await expect(
        service.createZone('unknown', 'partner-uuid', { shape: mockShape }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when partner does not own the hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ partner_id: 'other-partner' }));
      await expect(
        service.createZone('hunt-uuid', 'partner-uuid', { shape: mockShape }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateZone', () => {
    it('should update zone fields', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(mockZone());
      zonesRepo.save.mockResolvedValue(mockZone({ label: 'Zone B', order: 1 }));

      const result = await service.updateZone('hunt-uuid', 'zone-uuid', 'partner-uuid', {
        label: 'Zone B',
        order: 1,
      });

      expect(zonesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'zone-uuid', label: 'Zone B', order: 1 }),
      );
      expect(result.label).toBe('Zone B');
    });

    it('should throw NotFoundException when hunt not found', async () => {
      huntsRepo.findById.mockResolvedValue(null);
      await expect(
        service.updateZone('unknown', 'zone-uuid', 'partner-uuid', { label: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when partner does not own the hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ partner_id: 'other-partner' }));
      await expect(
        service.updateZone('hunt-uuid', 'zone-uuid', 'partner-uuid', { label: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when zone not found', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(null);
      await expect(
        service.updateZone('hunt-uuid', 'unknown-zone', 'partner-uuid', { label: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when zone belongs to different hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(mockZone({ hunt_id: 'other-hunt' }));
      await expect(
        service.updateZone('hunt-uuid', 'zone-uuid', 'partner-uuid', { label: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteZone', () => {
    it('should delete zone when partner owns the hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(mockZone());
      zonesRepo.deleteById.mockResolvedValue(undefined);

      await service.deleteZone('hunt-uuid', 'zone-uuid', 'partner-uuid');

      expect(zonesRepo.deleteById).toHaveBeenCalledWith('zone-uuid');
    });

    it('should throw NotFoundException when hunt not found', async () => {
      huntsRepo.findById.mockResolvedValue(null);
      await expect(
        service.deleteZone('unknown', 'zone-uuid', 'partner-uuid'),
      ).rejects.toThrow(NotFoundException);
      expect(zonesRepo.deleteById).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when partner does not own the hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt({ partner_id: 'other-partner' }));
      await expect(
        service.deleteZone('hunt-uuid', 'zone-uuid', 'partner-uuid'),
      ).rejects.toThrow(ForbiddenException);
      expect(zonesRepo.deleteById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when zone not found', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(null);
      await expect(
        service.deleteZone('hunt-uuid', 'unknown-zone', 'partner-uuid'),
      ).rejects.toThrow(NotFoundException);
      expect(zonesRepo.deleteById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when zone belongs to different hunt', async () => {
      huntsRepo.findById.mockResolvedValue(mockHunt());
      zonesRepo.findById.mockResolvedValue(mockZone({ hunt_id: 'other-hunt' }));
      await expect(
        service.deleteZone('hunt-uuid', 'zone-uuid', 'partner-uuid'),
      ).rejects.toThrow(NotFoundException);
      expect(zonesRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});
