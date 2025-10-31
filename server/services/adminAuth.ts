import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Admin authentication for seed endpoint
 * 
 * In development: Uses a simple admin token from environment
 * In production: Always denies access (seeding is dev-only)
 */

const ADMIN_TOKEN = process.env.ADMIN_SEED_TOKEN || generateDevToken();

/**
 * Generate a random token for development if none is set
 */
function generateDevToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  console.log(`[AdminAuth] No ADMIN_SEED_TOKEN set. Using generated token: ${token}`);
  console.log('[AdminAuth] Set ADMIN_SEED_TOKEN in environment to use a custom token');
  return token;
}

/**
 * Middleware to verify admin authentication for seed endpoint
 * 
 * Production: Always denies access
 * Development: Checks for valid admin token in Authorization header
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const env = process.env.NODE_ENV || 'development';

  // PRODUCTION GUARD: Never allow seeding in production
  if (env === 'production') {
    console.error('[AdminAuth] SECURITY: Seed endpoint access denied in production');
    return res.status(403).json({ 
      message: 'Seed endpoint is disabled in production for security reasons',
      error: 'PRODUCTION_SEED_DISABLED'
    });
  }

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Admin authentication required. Provide token in Authorization header',
      hint: 'Authorization: Bearer <ADMIN_SEED_TOKEN>'
    });
  }

  const providedToken = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Verify token
  if (providedToken !== ADMIN_TOKEN) {
    console.warn('[AdminAuth] Invalid admin token attempt');
    return res.status(403).json({ 
      message: 'Invalid admin token',
      error: 'INVALID_TOKEN'
    });
  }

  console.log('[AdminAuth] Admin access granted for seed endpoint');
  next();
}

/**
 * Get the current admin token (for display in development)
 */
export function getAdminToken(): string {
  return ADMIN_TOKEN;
}
