import { api, BASE_URL } from './api';

export interface FileUploadDto {
  key: string;           // minio: object key — stored in DB
  presignedUrl: string;  // short-lived URL for immediate display
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export const filesService = {
  async upload(file: File, context?: { huntId?: string; stepId?: string }): Promise<FileUploadDto> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<FileUploadDto>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: context,
    });
    return res.data;
  },

  async getPresignedUrl(key: string): Promise<string> {
    if (key.startsWith('http')) return key;
    // serve path retourné par rewriteArContentUrls → URL absolue via l'API
    if (key.startsWith('/files/serve')) return `${BASE_URL}${key}`;
    const res = await api.get<{ url: string }>('/files/presign', { params: { key } });
    return res.data.url;
  },

  // kept for compatibility — resolves key or absolute URL to displayable URL
  getFileUrl(keyOrUrl: string): string {
    if (keyOrUrl.startsWith('http')) return keyOrUrl;
    // fallback: return as-is (caller should use getPresignedUrl for async resolution)
    return keyOrUrl;
  },
};
