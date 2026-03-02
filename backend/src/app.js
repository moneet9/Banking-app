import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import bankingRoutes from './routes/bankingRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import managerRoutes from './routes/managerRoutes.js';

const app = express();

const configuredOrigins = new Set(env.clientOrigins);
const configuredHosts = new Set(
  env.clientOrigins
    .map((origin) => {
      try {
        return new URL(origin).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.has(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return true;
    }

    if (configuredHosts.has(parsed.hostname)) {
      return true;
    }

    if (
      /^192\.168\./.test(parsed.hostname) ||
      /^10\./.test(parsed.hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(parsed.hostname)
    ) {
      return true;
    }

    if (/^[a-zA-Z0-9-]+$/.test(parsed.hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: false,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/manager', managerRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
