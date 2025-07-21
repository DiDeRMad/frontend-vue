import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { apiRateLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Protected routes
router.use(apiRateLimiter);

// Placeholder routes - these would be expanded with actual implementations
router.get('/status', authenticate, (req, res) => {
  res.json({ message: 'API is running' });
});

export default router;