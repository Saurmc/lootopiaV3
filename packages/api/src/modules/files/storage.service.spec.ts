import { StorageService } from './storage.service';
import * as Minio from 'minio';

jest.mock('minio');

const mockPutObject = jest.fn().mockResolvedValue(undefined);
const mockPresignedGetObject = jest.fn().mockResolvedValue('http://minio/presigned-url');

(Minio.Client as jest.Mock).mockImplementation(() => ({
  putObject: mockPutObject,
  presignedGetObject: mockPresignedGetObject,
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService();
  });

  describe('upload', () => {
    it('stores file under partner prefix with readable filename', async () => {
      const file = {
        originalname: 'Mon Image.jpg',
        filename: 'uuid-abc.jpg',
        buffer: Buffer.from('data'),
        size: 4,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const key = await service.upload('partner-1', file);

      expect(mockPutObject).toHaveBeenCalledWith(
        expect.any(String),
        'partner-1/uuid-abc-mon-image.jpg',
        file.buffer,
        file.size,
        { 'Content-Type': 'image/jpeg' },
      );
      expect(key).toBe('minio:partner-1/uuid-abc-mon-image.jpg');
    });

    it('stores file under partner/hunts/{id}/steps/{id} when context provided', async () => {
      const file = {
        originalname: 'Tableau Monet.png',
        filename: 'uuid-abc.png',
        buffer: Buffer.from('data'),
        size: 4,
        mimetype: 'image/png',
      } as Express.Multer.File;

      const key = await service.upload('partner-1', file, 'hunt-42', 'step-7');

      expect(mockPutObject).toHaveBeenCalledWith(
        expect.any(String),
        'partner-1/hunts/hunt-42/steps/step-7/uuid-abc-tableau-monet.png',
        file.buffer,
        file.size,
        { 'Content-Type': 'image/png' },
      );
      expect(key).toBe('minio:partner-1/hunts/hunt-42/steps/step-7/uuid-abc-tableau-monet.png');
    });
  });

  describe('getPresignedUrl', () => {
    it('returns presigned URL for minio: key', async () => {
      const url = await service.getPresignedUrl('minio:partner-1/uuid-abc.jpg');
      expect(mockPresignedGetObject).toHaveBeenCalledWith(
        expect.any(String),
        'partner-1/uuid-abc.jpg',
        3600,
      );
      expect(url).toBe('http://minio/presigned-url');
    });

    it('returns original URL unchanged if not a minio: key', async () => {
      const url = await service.getPresignedUrl('http://external.com/image.jpg');
      expect(mockPresignedGetObject).not.toHaveBeenCalled();
      expect(url).toBe('http://external.com/image.jpg');
    });
  });

  describe('rewriteArContentUrls', () => {
    it('rewrites 2d-overlay image key to presigned URL', async () => {
      const ar = { type: '2d-overlay', image: 'minio:p1/img.jpg' };
      const result = await service.rewriteArContentUrls(ar);
      expect(result).toEqual({ type: '2d-overlay', image: 'http://minio/presigned-url' });
    });

    it('rewrites ar-3d-spatial marker_image key to presigned URL', async () => {
      const ar = { type: 'ar-3d-spatial', marker_image: 'minio:p1/marker.jpg', model_url: 'http://model' };
      const result = await service.rewriteArContentUrls(ar);
      expect(result).toMatchObject({ type: 'ar-3d-spatial', marker_image: 'http://minio/presigned-url' });
    });

    it('returns null unchanged', async () => {
      const result = await service.rewriteArContentUrls(null);
      expect(result).toBeNull();
    });
  });
});
