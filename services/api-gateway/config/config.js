import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:8002',
    module: process.env.MODULE_SERVICE_URL || 'http://localhost:8003',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:8004',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};
