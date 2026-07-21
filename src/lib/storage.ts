import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export interface StorageAdapter {
  save(buffer: Buffer, originalName: string): Promise<string>;
  read(relativePath: string): Promise<Buffer>;
  delete(relativePath: string): Promise<void>;
}

const STORAGE_DIR = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "storage", "uploads");

class LocalStorageAdapter implements StorageAdapter {
  async save(buffer: Buffer, originalName: string): Promise<string> {
    await mkdir(STORAGE_DIR, { recursive: true });
    const ext = path.extname(originalName);
    const filename = `${randomUUID()}${ext}`;
    await writeFile(path.join(STORAGE_DIR, filename), buffer);
    return filename;
  }

  async read(relativePath: string): Promise<Buffer> {
    return readFile(path.join(STORAGE_DIR, relativePath));
  }

  async delete(relativePath: string): Promise<void> {
    await unlink(path.join(STORAGE_DIR, relativePath)).catch(() => undefined);
  }
}

// Единая точка расширения: заменить на S3StorageAdapter при переходе с диска на объектное хранилище.
export const storage: StorageAdapter = new LocalStorageAdapter();
