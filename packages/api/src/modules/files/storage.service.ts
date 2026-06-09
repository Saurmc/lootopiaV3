import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import type { Readable } from 'stream';

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

  private toObjectKey(keyOrUrl: string): string | null {
    if (keyOrUrl.startsWith(MINIO_PREFIX)) return keyOrUrl.slice(MINIO_PREFIX.length);
    if (keyOrUrl.includes(`:9000/`) || keyOrUrl.startsWith(this.internalEndpoint)) {
      return this.extractKeyFromAbsoluteUrl(keyOrUrl);
    }
    return null;
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
    const objectKey = this.toObjectKey(keyOrUrl);
    if (objectKey) {
      return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
    }
    return keyOrUrl;
  }

  /** Retourne un stream du fichier depuis MinIO + son content-type. */
  async streamObject(keyOrUrl: string): Promise<{ stream: Readable; contentType: string }> {
    const objectKey = this.toObjectKey(keyOrUrl);
    if (!objectKey) throw new Error(`Invalid storage key: ${keyOrUrl}`);

    const [stream, stat] = await Promise.all([
      this.client.getObject(this.bucket, objectKey),
      this.client.statObject(this.bucket, objectKey),
    ]);

    const contentType =
      (stat.metaData?.['content-type'] as string | undefined) ||
      'application/octet-stream';

    return { stream, contentType };
  }

  /**
   * Réécrit les URLs de contenu AR pour qu'elles passent par l'API (/files/serve?key=…)
   * au lieu de pointer directement sur MinIO.
   * Cela permet aux clients (mobile, navigateur) d'accéder aux images sans avoir besoin
   * d'atteindre MinIO directement.
   */
  async rewriteArContentUrls(
    arContent: Record<string, unknown> | null,
  ): Promise<Record<string, unknown> | null> {
    if (!arContent) return null;
    const ac = { ...arContent };

    if (typeof ac.image === 'string') {
      ac.image = this.toServeUrl(ac.image);
    }
    if (typeof ac.marker_image === 'string') {
      ac.marker_image = this.toServeUrl(ac.marker_image);
    }
    if (typeof ac.artwork_image === 'string') {
      ac.artwork_image = this.toServeUrl(ac.artwork_image);
    }

    return ac;
  }

  /** Convertit une clé minio: en chemin relatif /files/serve?key=… */
  toServeUrl(keyOrUrl: string): string {
    if (!keyOrUrl.startsWith(MINIO_PREFIX)) return keyOrUrl;
    return `/files/serve?key=${encodeURIComponent(keyOrUrl)}`;
  }
}
