import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/config.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: `Too many requests from this IP. Limit: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 60000} minutes. Please try again later.`,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Service temporarily unavailable' });
  },
};

// Route to services
app.use('/api/auth', createProxyMiddleware({
  target: config.services.auth,
  pathRewrite: { '^/api/auth': '/auth' },
  ...proxyOptions,
}));

app.use('/api/messages', createProxyMiddleware({
  target: config.services.messaging,
  pathRewrite: { '^/api/messages': '/messages' },
  ...proxyOptions,
}));

app.use('/api/modules', createProxyMiddleware({
  target: config.services.module,
  pathRewrite: { '^/api/modules': '/modules' },
  ...proxyOptions,
}));

app.use('/api/courses', createProxyMiddleware({
  target: config.services.module,
  pathRewrite: { '^/api/courses': '/courses' },
  ...proxyOptions,
}));

app.use('/api/admin', createProxyMiddleware({
  target: config.services.admin,
  pathRewrite: { '^/api/admin': '/admin' },
  ...proxyOptions,
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  const services = {
    auth: config.services.auth,
    messaging: config.services.messaging,
    module: config.services.module,
    admin: config.services.admin,
  };

  const healthChecks = {};
  
  for (const [name, url] of Object.entries(services)) {
    try {
      const response = await fetch(`${url}/health`);
      healthChecks[name] = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthChecks[name] = 'unreachable';
    }
  }

  const allHealthy = Object.values(healthChecks).every(status => status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    gateway: 'running',
    services: healthChecks,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'ModNet API Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      messages: '/api/messages',
      modules: '/api/modules',
      courses: '/api/courses',
      admin: '/api/admin',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log('Service URLs:', config.services);
});

export default app;
