import User from '../models/User.js';
import { verifyToken } from '../utils/token.js';

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing auth token' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid auth token' });
    }

    req.user = user;
    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
    }

    return next();
  };
}

export { requireAuth, requireRole };
