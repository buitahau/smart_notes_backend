import { Hono } from 'hono';
import welcomeController from '../controllers/welcomeController.js';

const router = new Hono();

router.get('/', welcomeController.getWelcome);

export default router;
