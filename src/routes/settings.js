import { Hono } from 'hono';
import settingController from '../controllers/settingController.js';
import { authenticateToken } from '../middleware/index.js';

const router = new Hono();

router.use('*', authenticateToken);

router.post('/', c => settingController.createSetting(c));
router.get('/', c => settingController.getSetting(c));
router.patch('/', c => settingController.partialUpdateSetting(c));
router.post('/createDefaultSetting', c =>
  settingController.createDefaultSetting(c)
);

export default router;
