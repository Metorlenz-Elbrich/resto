import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOADS_DIR } from '@/lib/db';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 Mo

export async function savePhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new Error('Format de photo non supporté (jpg, png, webp ou gif uniquement).');
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('La photo est trop lourde (8 Mo maximum).');
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return filename;
}

export async function deletePhoto(filename: string | null | undefined): Promise<void> {
  if (!filename) return;
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // Le fichier n'existe déjà plus — rien à faire.
  }
}
