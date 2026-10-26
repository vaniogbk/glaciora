import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../../config/env';

/** Stockage privé (justificatifs de virement) : aucun accès public, lecture via l'API admin uniquement. */
export interface PrivateStorage {
  readonly driver: 'local' | 'r2';
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

const KEY_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,200}\.[a-z0-9]{2,5}$/;

export function assertSafeKey(key: string): void {
  if (!KEY_PATTERN.test(key) || key.includes('..') || key.includes('//')) throw new Error('Clé de stockage invalide');
}

export class LocalStorage implements PrivateStorage {
  readonly driver = 'local' as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    assertSafeKey(key);
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error('Chemin hors du stockage');
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body, { flag: 'wx', mode: 0o600 });
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async remove(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}

export class R2Storage implements PrivateStorage {
  readonly driver = 'r2' as const;
  private readonly client: S3Client;

  constructor(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
    private readonly bucket: string,
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }));
  }

  async get(key: string): Promise<Buffer> {
    assertSafeKey(key);
    const out = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!out.Body) throw new Error('Objet vide');
    return Buffer.from(await out.Body.transformToByteArray());
  }

  async remove(key: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let instance: PrivateStorage | undefined;

export function getStorage(): PrivateStorage {
  if (!instance) {
    instance =
      env.STORAGE_DRIVER === 'r2'
        ? new R2Storage(env.R2_ACCOUNT_ID!, env.R2_ACCESS_KEY_ID!, env.R2_SECRET_ACCESS_KEY!, env.R2_BUCKET!)
        : new LocalStorage(env.STORAGE_LOCAL_DIR);
  }
  return instance;
}

/** Pour les tests. */
export function setStorage(storage: PrivateStorage | undefined): void {
  instance = storage;
}
