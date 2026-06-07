import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';

const MINIO_PREFIX = 'minio:';

@Injectable()
export class StorageService {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly internalEndpoint: string;
  private readonly publicEndpoint: string;

  constructor() {
    this.internalEndpoint = (process.env.S3_ENDPOINT || 'http://localhost:9000').replace(/\/$/, '');
    this.publicEndpoint = (process.env.S3_PUBLIC_ENDPOINT || this.internalEndpoint).replace(/\/$/, '');

    // On configure le client MinIO avec le public endpoint pour que les presigned URLs
    // soient générées avec la bonne IP dès le départ (la signature inclut le hostname)
    const url = new URL(this.publicEndpoint);
    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port ? parseInt(url.port) : url.protocol === 'https:' ? 443 : 80,
      useSSL: url.protocol === 'https:',
      accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.S3_SECRET_KEY || 'minioadmin123',
    });
    this.bucket = process.env.S3_BUCKET || 'lootopia';
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  // Extrait la clé objet depuis une URL absolue MinIO stockée en base (avec ou sans query string)
  private extractKeyFromAbsoluteUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] !== this.bucket) return null;
      return pathParts.slice(1).join('/');
    } catch {
      return null;
    }
  }

  async upload(
    partnerId: string,
    file: Express.Multer.File,
    huntId?: string,
    stepId?: string,
  ): Promise<string> {
    const ext = file.filename.slice(file.filename.lastIndexOf('.'));
    const uuid = file.filename.replace(/\.[^.]+$/, '');
    const slug = this.slugify(file.originalname);
    const filename = `${uuid}-${slug}${ext}`;

    const folders = [partnerId];
    if (huntId) folders.push('hunts', huntId);
    if (stepId) folders.push('steps', stepId);

    const objectKey = [...folders, filename].join('/');
    await this.client.putObject(this.bucket, objectKey, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return `${MINIO_PREFIX}${objectKey}`;
  }

  async getPresignedUrl(keyOrUrl: string, expirySeconds = 3600): Promise<string> {
    // Clé minio: → presigned URL signée avec le public endpoint
    if (keyOrUrl.startsWith(MINIO_PREFIX)) {
      const objectKey = keyOrUrl.slice(MINIO_PREFIX.length);
      return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
    }

    // Ancienne URL absolue MinIO (localhost ou autre) → extraire la clé et re-signer
    if (keyOrUrl.includes(`:9000/`) || keyOrUrl.startsWith(this.internalEndpoint)) {
      const objectKey = this.extractKeyFromAbsoluteUrl(keyOrUrl);
      if (objectKey) {
        return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
      }
    }

    return keyOrUrl;
  }

  async rewriteArContentUrls(
    arContent: Record<string, unknown> | null,
  ): Promise<Record<string, unknown> | null> {
    if (!arContent) return null;
    const ac = { ...arContent };

    if (typeof ac.image === 'string') {
      ac.image = await this.getPresignedUrl(ac.image);
    }
    if (typeof ac.marker_image === 'string') {
      ac.marker_image = await this.getPresignedUrl(ac.marker_image);
    }
    if (typeof ac.artwork_image === 'string') {
      ac.artwork_image = await this.getPresignedUrl(ac.artwork_image);
    }

    return ac;
  }
}
