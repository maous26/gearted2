import express from 'express';
import { ShippingController } from '../controllers/ShippingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Ajouter une adresse de livraison (acheteur)
router.post('/address/:transactionId', ShippingController.addShippingAddress);

// Définir les dimensions du colis (vendeur uniquement)
router.post('/dimensions/:transactionId', ShippingController.setParcelDimensions);

// Obtenir les tarifs de livraison (acheteur et vendeur)
router.post('/rates/:transactionId', ShippingController.getShippingRates);

// Acheter une étiquette de livraison (vendeur uniquement)
router.post('/label/:transactionId', ShippingController.purchaseLabel);

// Obtenir les informations de suivi
router.get('/tracking/:transactionId', ShippingController.getTracking);

// Obtenir toutes les expéditions en attente (vendeur)
router.get('/pending', ShippingController.getPendingShipments);

// RGPD - Gestion des données personnelles
router.delete('/address/:transactionId', ShippingController.deleteShippingAddress);
router.get('/my-addresses', ShippingController.getMyShippingAddresses);

export default router;
