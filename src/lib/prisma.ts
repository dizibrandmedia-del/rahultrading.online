import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const cwd = process.cwd();
  const prismaDbPath = path.resolve(cwd, 'prisma', 'dev.db');
  const rootDbPath = path.resolve(cwd, 'dev.db');

  // Check persistent shared host location (outside versioned hbuilds on Hostinger)
  const hostingerDomainRoot = '/home/u468161300/domains/rahultrading.online';
  const hostingerPersistentDb = path.join(hostingerDomainRoot, 'dev.db');
  if (fs.existsSync(hostingerDomainRoot)) {
    try {
      if (fs.existsSync(hostingerPersistentDb) && fs.statSync(hostingerPersistentDb).size > 0) {
        return `file:${hostingerPersistentDb}`;
      } else if (fs.existsSync(prismaDbPath) && fs.statSync(prismaDbPath).size > 0) {
        fs.copyFileSync(prismaDbPath, hostingerPersistentDb);
        return `file:${hostingerPersistentDb}`;
      } else if (fs.existsSync(rootDbPath) && fs.statSync(rootDbPath).size > 0) {
        fs.copyFileSync(rootDbPath, hostingerPersistentDb);
        return `file:${hostingerPersistentDb}`;
      }
    } catch (_) {}
  }

  // If prisma/dev.db exists, sync it to root dev.db for compatibility
  if (fs.existsSync(prismaDbPath)) {
    try {
      if (!fs.existsSync(rootDbPath) || fs.statSync(rootDbPath).size === 0) {
        fs.copyFileSync(prismaDbPath, rootDbPath);
      }
    } catch (_) {}
    return `file:${prismaDbPath.replace(/\\/g, '/')}`;
  }

  // If root dev.db exists, sync it to prisma/dev.db
  if (fs.existsSync(rootDbPath)) {
    try {
      const prismaDir = path.resolve(cwd, 'prisma');
      if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir, { recursive: true });
      if (!fs.existsSync(prismaDbPath) || fs.statSync(prismaDbPath).size === 0) {
        fs.copyFileSync(rootDbPath, prismaDbPath);
      }
    } catch (_) {}
    return `file:${rootDbPath.replace(/\\/g, '/')}`;
  }

  // Fallback to environment variable or standard location
  return process.env.DATABASE_URL || `file:${prismaDbPath.replace(/\\/g, '/')}`;
}

const resolvedDbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
