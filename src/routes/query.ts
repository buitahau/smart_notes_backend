import { Hono } from 'hono';
import queryController from '../controllers/queryController.js';
import { authenticateToken } from '../middleware/index.js';

const router = new Hono();

// All note routes require authentication
router.use('*', authenticateToken);

router.post('/', queryController.query);

export default router;
