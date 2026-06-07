import { Injectable } from '@nestjs/common';

export interface UploadedFileResult {
  key: string;        // minio: object key stored in DB
  presignedUrl: string; // short-lived URL for immediate display
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
  buildResult(
    file: Express.Multer.File,
    key: string,
    presignedUrl: string,
  ): UploadedFileResult {
    return {
      key,
      presignedUrl,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
