import { BadRequestException } from '@nestjs/common';
import { FilesService, MAX_SIZE_BYTES } from './files.service';

const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'image.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 1024,
  destination: './uploads',
  filename: 'uuid-generated.png',
  path: './uploads/uuid-generated.png',
  buffer: Buffer.from(''),
  stream: undefined as any,
  ...overrides,
});

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(() => {
    service = new FilesService();
  });

  describe('validateFile', () => {
    it('should not throw for allowed mime types', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      for (const mimetype of allowedTypes) {
        expect(() => service.validateFile(mockFile({ mimetype }))).not.toThrow();
      }
    });

    it('should throw BadRequestException for disallowed mime type', () => {
      const file = mockFile({ mimetype: 'text/javascript' });
      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when file exceeds max size', () => {
      const file = mockFile({ size: MAX_SIZE_BYTES + 1 });
      expect(() => service.validateFile(file)).toThrow(BadRequestException);
    });

    it('should not throw when file is exactly at max size', () => {
      const file = mockFile({ size: MAX_SIZE_BYTES });
      expect(() => service.validateFile(file)).not.toThrow();
    });
  });

  describe('buildResult', () => {
    it('should return correct result for valid file', () => {
      const file = mockFile({
        filename: 'abc123.png',
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 2048,
      });

      const result = service.buildResult(file);

      expect(result.url).toBe('/uploads/abc123.png');
      expect(result.filename).toBe('abc123.png');
      expect(result.originalname).toBe('photo.png');
      expect(result.mimetype).toBe('image/png');
      expect(result.size).toBe(2048);
    });

    it('should throw when file type is invalid', () => {
      const file = mockFile({ mimetype: 'application/exe' });
      expect(() => service.buildResult(file)).toThrow(BadRequestException);
    });
  });
});
