import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

const allowedMime: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function getUploadRoot(): string {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

export function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return '.jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return '.png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return '.webp';
  }
  return null;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dest = getUploadRoot();
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = allowedMime[file.mimetype] ?? '';
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const receiptUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!allowedMime[file.mimetype]) {
      cb(new AppError(400, 'Receipt must be a JPEG, PNG, or WebP image'));
      return;
    }
    cb(null, true);
  },
});

export function assertSafeStoredImage(filePath: string) {
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buffer, 0, 16, 0);
  } finally {
    fs.closeSync(fd);
  }
  const ext = detectImageExtension(buffer);
  if (!ext) {
    fs.unlinkSync(filePath);
    throw new AppError(400, 'The uploaded file is not a valid image');
  }
  const currentExt = path.extname(filePath).toLowerCase();
  if (currentExt !== ext) {
    const nextPath = filePath.slice(0, -currentExt.length) + ext;
    fs.renameSync(filePath, nextPath);
    return nextPath;
  }
  return filePath;
}

export function toPublicReceiptName(absolutePath: string): string {
  return path.basename(absolutePath);
}

export function resolveOwnedReceipt(storedName: string): string {
  const base = path.basename(storedName);
  const absolute = path.join(getUploadRoot(), base);
  if (!absolute.startsWith(getUploadRoot())) {
    throw new AppError(400, 'Invalid receipt path');
  }
  if (!fs.existsSync(absolute)) {
    throw new AppError(404, 'Receipt file is not available');
  }
  return absolute;
}
