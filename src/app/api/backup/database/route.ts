import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cwd = process.cwd();
    let dbPath = path.resolve(cwd, 'prisma', 'dev.db');
    
    // Fallback to root dev.db if prisma/dev.db doesn't exist
    if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
      dbPath = path.resolve(cwd, 'dev.db');
    }

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json(
        { error: 'Database file not found on server' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `RJTC_Live_Database_${dateStr}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Database backup error:', error);
    return NextResponse.json(
      { error: 'Failed to generate database backup: ' + error.message },
      { status: 500 }
    );
  }
}
