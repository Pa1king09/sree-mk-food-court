import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { menuRouter } from './routes/menu.routes.js';
import { adminRouter } from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Enable CORS for local-network access from mobile browsers
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging for audit & debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api', menuRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), offline: true });
});

// Serve client assets & static files
const clientDist = path.resolve(__dirname, '../../client/dist');
const clientPublic = path.resolve(__dirname, '../../client/public');

// If client build exists, serve it
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

// Fallback serve client public directory (for dev/pre-build direct access)
if (fs.existsSync(clientPublic)) {
  app.use(express.static(clientPublic));
}

// SPA fallback for client-side routing
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If client is not built yet, show a friendly development message
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sree MK Food Court - Offline Server</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: sans-serif; background: #0c2419; color: #fcfbf7; padding: 2rem; text-align: center; }
            h1 { color: #facc15; }
            .card { background: #143527; padding: 1.5rem; border-radius: 8px; max-width: 600px; margin: 2rem auto; border: 1px solid #ca8a04; }
            a { color: #fde047; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Sree MK Food Court</h1>
            <p>The backend server is running offline successfully.</p>
            <p>API Endpoint: <a href="/api/menu">/api/menu</a></p>
            <p>Network Info & QR: <a href="/api/network-info">/api/network-info</a></p>
            <p>Run <code>npm run build</code> to bundle the client app.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});
