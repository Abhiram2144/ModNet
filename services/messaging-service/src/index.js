import express from 'express';
import cors from 'cors';
import { config } from '../config/config.js';
import messagingRoutes from './routes/messagingRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', messagingRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    service: 'messaging-service', 
    version: '1.0.0',
    status: 'running' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Messaging Service running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
