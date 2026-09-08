const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');
const fs = require('fs');
const next = require('next');

// Ensure SQLite database file is synchronized
try {
  const cwd = process.cwd();
  const prismaDb = path.resolve(cwd, 'prisma', 'dev.db');
  const rootDb = path.resolve(cwd, 'dev.db');

  if (fs.existsSync(prismaDb) && (!fs.existsSync(rootDb) || fs.statSync(rootDb).size === 0)) {
    fs.copyFileSync(prismaDb, rootDb);
  } else if (fs.existsSync(rootDb) && (!fs.existsSync(prismaDb) || fs.statSync(prismaDb).size === 0)) {
    const prismaDir = path.resolve(cwd, 'prisma');
    if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir, { recursive: true });
    fs.copyFileSync(rootDb, prismaDb);
  }
} catch (e) {
  console.warn('DB sync warning:', e.message);
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      
      // If not a static hash chunk, ensure no edge/browser caching of HTML
      if (!req.url.startsWith('/_next/static/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
