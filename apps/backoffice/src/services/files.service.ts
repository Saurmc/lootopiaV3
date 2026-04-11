import { api } from './api';

export interface FileUploadDto {
  url: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo

export const filesService = {
  async upload(file: File): Promise<FileUploadDto> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<FileUploadDto>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getFileUrl(url: string): string {
    const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    return url.startsWith('http') ? url : `${base}${url}`;
  },
};
