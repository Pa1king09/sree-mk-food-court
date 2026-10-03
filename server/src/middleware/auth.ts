import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';

// Retrieve or generate persistent JWT secret
let jwtSecret: string;
const existingSecret = db.prepare('SELECT value FROM settings WHERE key = ?').get('jwt_secret') as { value: string } | undefined;
if (existingSecret && existingSecret.value) {
  jwtSecret = existingSecret.value;
} else {
  jwtSecret = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('jwt_secret', jwtSecret);
}

export function getJwtSecret() {
  return jwtSecret;
}

export interface AuthenticatedRequest extends Request {
  adminUser?: {
    username: string;
  };
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret) as { username: string };
    req.adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
}

// In-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

export function loginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttempt > WINDOW_MS) {
      loginAttempts.set(ip, { count: 1, firstAttempt: now });
      next();
    } else if (record.count >= MAX_ATTEMPTS) {
      const waitMinutes = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000);
      res.status(429).json({
        error: `Too many login attempts. Please try again after ${waitMinutes} minutes.`
      });
    } else {
      record.count += 1;
      next();
    }
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    next();
  }
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}
