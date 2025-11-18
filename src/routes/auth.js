import { Hono } from 'hono';
import authController from '../controllers/authController.js';

const router = new Hono();

router.post('/otp', authController.signInWithOtp);
router.post('/otp/verify', authController.verifyOtp);
router.post('/logout', authController.logout);
router.get('/validate', authController.validateToken);

export default router;
