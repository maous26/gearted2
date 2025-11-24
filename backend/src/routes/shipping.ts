import express from 'express';
import { ShippingController } from '../controllers/ShippingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Ajouter une adresse de livraison
router.post('/address/:transactionId', ShippingController.addShippingAddress);

// Obtenir les tarifs de livraison (vendeur uniquement)
router.post('/rates/:transactionId', ShippingController.getShippingRates);

// Acheter une étiquette de livraison (vendeur uniquement)
router.post('/label/:transactionId', ShippingController.purchaseLabel);

// Obtenir les informations de suivi
router.get('/tracking/:transactionId', ShippingController.getTracking);

// Obtenir toutes les expéditions en attente (vendeur)
router.get('/pending', ShippingController.getPendingShipments);

export default router;
