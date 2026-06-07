import { FilesService, MAX_SIZE_BYTES } from './files.service';

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'image.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 1024,
  destination: '',
  filename: 'uuid-generated.png',
  path: '',
  buffer: Buffer.from(''),
  stream: undefined as any,
  ...overrides,
});

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
  });

  describe('buildResult', () => {
    it('returns key, presignedUrl and file metadata', () => {
      const file = mockFile({ filename: 'abc123.png', originalname: 'photo.png', size: 2048 });
      const key = 'minio:partner-1/abc123.png';
      const presignedUrl = 'http://minio/presigned';

      const result = service.buildResult(file, key, presignedUrl);

      expect(result.key).toBe(key);
      expect(result.presignedUrl).toBe(presignedUrl);
      expect(result.filename).toBe('abc123.png');
      expect(result.originalname).toBe('photo.png');
      expect(result.size).toBe(2048);
    });
  });

  describe('MAX_SIZE_BYTES', () => {
    it('is 10 MB', () => {
      expect(MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
    });
  });
});
