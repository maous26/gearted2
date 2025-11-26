import { Router } from 'express';
import { MondialRelayController } from '../controllers/MondialRelayController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required for searching pickup points)
router.get('/pickup-points', MondialRelayController.searchPickupPoints);
router.get('/rates', MondialRelayController.getShippingRates);
router.get('/tracking/:expeditionNumber', MondialRelayController.getTracking);

// Protected routes (authentication required)
router.post('/label/:transactionId', authenticate, MondialRelayController.createLabel);

export default router;
