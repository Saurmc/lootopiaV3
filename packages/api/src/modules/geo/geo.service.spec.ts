import { GeoService } from './geo.service';
import { DataSource } from 'typeorm';

describe('GeoService', () => {
  let service: GeoService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    dataSource = {
      query: jest.fn(),
    } as unknown as jest.Mocked<DataSource>;

    service = new GeoService(dataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call PostGIS query with correct parameters', async () => {
    dataSource.query.mockResolvedValue([]);
    await service.findHuntsNearby(48.8566, 2.3522, 5000);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('ST_DWithin'),
      [48.8566, 2.3522, 5000],
    );
  });

  it('should return array of nearby hunts', async () => {
    const mockRows = [
      { id: 'hunt-1', title: 'Chasse Paris', distance_meters: 250 },
      { id: 'hunt-2', title: 'Chasse Louvre', distance_meters: 800 },
    ];
    dataSource.query.mockResolvedValue(mockRows);

    const result = await service.findHuntsNearby(48.8566, 2.3522, 5000);

    expect(result).toHaveLength(2);
    expect(result[0].distance_meters).toBe(250);
  });

  it('should return empty array when no hunts nearby', async () => {
    dataSource.query.mockResolvedValue([]);
    const result = await service.findHuntsNearby(0, 0, 100);
    expect(result).toEqual([]);
  });

  describe('isWithinRadius', () => {
    const stepLocation = { type: 'Point', coordinates: [-1.69373, 48.089] };

    it('should return true when player is within radius', async () => {
      dataSource.query.mockResolvedValue([{ within: true }]);
      const result = await service.isWithinRadius(48.089, -1.69373, stepLocation, 50);
      expect(result).toBe(true);
    });

    it('should return false when player is outside radius', async () => {
      dataSource.query.mockResolvedValue([{ within: false }]);
      const result = await service.isWithinRadius(48.0, -1.6, stepLocation, 50);
      expect(result).toBe(false);
    });

    it('should use ST_GeomFromGeoJSON and pass correct parameters', async () => {
      dataSource.query.mockResolvedValue([{ within: true }]);
      await service.isWithinRadius(48.089, -1.69373, stepLocation, 50);

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_GeomFromGeoJSON($1)'),
        [JSON.stringify(stepLocation), 48.089, -1.69373, 50],
      );
    });

    it('should return false when query returns empty rows', async () => {
      dataSource.query.mockResolvedValue([]);
      const result = await service.isWithinRadius(48.089, -1.69373, stepLocation, 50);
      expect(result).toBe(false);
    });
  });
});
