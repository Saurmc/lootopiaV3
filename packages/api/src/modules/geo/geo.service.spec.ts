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
});
