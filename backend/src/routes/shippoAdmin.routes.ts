import { Router } from 'express';
import { ShippoAdminController } from '../controllers/ShippoAdminController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticate);

/**
 * GET /api/admin/shippo/carriers
 * List all carrier accounts
 */
router.get('/carriers', ShippoAdminController.listCarriers);

/**
 * GET /api/admin/shippo/carriers/summary
 * Get summary with statistics
 */
router.get('/carriers/summary', ShippoAdminController.getCarriersSummary);

/**
 * GET /api/admin/shippo/carriers/by-name/:carrierName
 * Get carriers by name (colissimo, mondialrelay, chronopost)
 */
router.get('/carriers/by-name/:carrierName', ShippoAdminController.getCarriersByName);

/**
 * POST /api/admin/shippo/carriers/colissimo
 * Connect Colissimo account
 * Body: { accountId: string, password: string, isTest?: boolean }
 */
router.post('/carriers/colissimo', ShippoAdminController.connectColissimo);

/**
 * POST /api/admin/shippo/carriers/mondialrelay
 * Connect Mondial Relay account
 * Body: { merchantId: string, apiKey: string, isTest?: boolean }
 */
router.post('/carriers/mondialrelay', ShippoAdminController.connectMondialRelay);

/**
 * POST /api/admin/shippo/carriers/chronopost
 * Connect Chronopost account
 * Body: { accountNumber: string, password?: string, isTest?: boolean }
 */
router.post('/carriers/chronopost', ShippoAdminController.connectChronopost);

/**
 * POST /api/admin/shippo/carriers/setup-all
 * Setup all carriers from .env
 * Body: { isTest?: boolean }
 */
router.post('/carriers/setup-all', ShippoAdminController.setupAllCarriers);

/**
 * PUT /api/admin/shippo/carriers/:carrierId
 * Update carrier account
 * Body: { active?: boolean, parameters?: object }
 */
router.put('/carriers/:carrierId', ShippoAdminController.updateCarrier);

/**
 * DELETE /api/admin/shippo/carriers/:carrierId
 * Delete carrier account
 */
router.delete('/carriers/:carrierId', ShippoAdminController.deleteCarrier);

export default router;
