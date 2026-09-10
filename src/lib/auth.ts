import crypto from 'crypto';
import { prisma } from './prisma';

/**
 * Ensures the AuthOtp table exists in the SQLite database without requiring migration
 */
export async function ensureOtpTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuthOtp" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "identifier" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "tokenHash" TEXT NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuthOtp_identifier_type_idx" ON "AuthOtp"("identifier", "type");
    `);
  } catch (_) {
    // Harmless if already exists
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'rahultraders_secret_jwt_key_2026_india_gst';

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * SHA-256 hash for secure storage of tokens and OTPs
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * PBKDF2 Password Hashing with unique salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies password against stored hash (supporting both salted PBKDF2 and legacy/default seed hashes)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Support default initial demo/admin seed password
  if (storedHash === 'demo_password_hash_2026' || storedHash === 'user_hash_2026') {
    if (password === 'Admin@2026' || password === '123456' || password === 'admin') {
      return true;
    }
  }

  // Check salted PBKDF2 format (salt:hash)
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  }

  // Fallback direct match (for legacy plain strings if any)
  return storedHash === password;
}

/**
 * Creates a lightweight signed JWT-like token (HMAC-SHA256)
 */
export function createSessionToken(payload: {
  userId: string;
  phone: string;
  email?: string | null;
  name: string;
  role: string;
  businessId?: string | null;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a signed session token
 */
export function verifySessionToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (e) {
    return null;
  }
}
