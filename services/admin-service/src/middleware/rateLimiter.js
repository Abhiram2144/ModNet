import rateLimit from 'express-rate-limit';

// Strict rate limiter for admin login
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 login attempts per windowMs
  message: 'Too many admin login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter for admin operations
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per windowMs
  message: 'Too many admin requests. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});
