import { Hono } from 'hono';
import indexController from '../controllers/indexController.js';
import { authenticateToken } from '../middleware/index.js';

const router = new Hono();

// All index routes require authentication
router.use('*', authenticateToken);

// Create vector index
router.get('/create', indexController.createIndex);

// Create metadata index
router.get('/create-metadata', indexController.createMetadataIndex);

// Delete index
router.post('/delete', indexController.deleteIndex);

// List metadata indexes
router.get('/list-metadata', indexController.listMetadataIndex);

export default router;
