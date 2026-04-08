import { BadRequestException, Injectable } from '@nestjs/common';

export interface UploadedFileResult {
  url: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class FilesService {
  validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé. Formats acceptés : jpg, png, gif, webp, pdf`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale : 10 Mo`,
      );
    }
  }

  buildResult(file: Express.Multer.File): UploadedFileResult {
    this.validateFile(file);
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
