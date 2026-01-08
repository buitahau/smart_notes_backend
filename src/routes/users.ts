import { Hono } from 'hono';
import userController from '../controllers/userController.js';
import { authenticateToken } from '../middleware/index.js';

const router = new Hono();

router.use('*', authenticateToken);

router.get('/me', c => userController.getUserDetail(c));
router.put('/me', c => userController.updateUser(c));

export default router;
