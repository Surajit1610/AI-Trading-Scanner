import type { Request, Response, NextFunction } from 'express';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const FRONTEND_URL = process.env.FRONTEND_INTERNAL_URL || 'http://frontend-next:3000';
    
    const sessionRes = await fetch(`${FRONTEND_URL}/api/auth/get-session`, {
      headers: {
        cookie: req.headers.cookie || '',
        authorization: req.headers.authorization || ''
      }
    });

    if (!sessionRes.ok) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session' });
    }

    const sessionData = await sessionRes.json();

    if (!sessionData || !sessionData.session || !sessionData.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session' });
    }

    if (sessionData.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required.' });
    }

    req.user = { id: sessionData.session.userId.toString() };
    next();
  } catch (error) {
    console.error('Admin Middleware Error:', error);
    res.status(500).json({ error: 'Internal server error during admin authentication' });
  }
};
