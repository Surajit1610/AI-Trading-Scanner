import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_INTERNAL_URL || 'http://frontend-next:3000';
    
    // Instead of querying MongoDB directly (which fails because Better Auth signs the cookie),
    // we simply ask the Better Auth instance on the frontend to validate the cookie for us.
    const sessionRes = await fetch(`${FRONTEND_URL}/api/auth/get-session`, {
      headers: {
        cookie: req.headers.cookie || '',
        authorization: req.headers.authorization || ''
      }
    });

    if (!sessionRes.ok) {
      console.log('[requireAuth] sessionRes not ok:', sessionRes.status);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    const sessionData = await sessionRes.json();
    console.log('[requireAuth] Session validated via frontend:', sessionData ? 'success' : 'failed');

    if (!sessionData || !sessionData.session || !sessionData.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    if (sessionData.user.accountStatus === 'pending') {
      return res.status(403).json({ error: 'Forbidden: Account is pending activation by an administrator.' });
    }

    // Attach user to request
    req.user = { id: sessionData.session.userId.toString() };
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
