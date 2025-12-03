import express from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer mes ventes (en tant que vendeur)
router.get('/my-sales', TransactionController.getMySales);

// Récupérer mes achats (en tant qu'acheteur)
router.get('/my-purchases', TransactionController.getMyPurchases);

// Annuler une transaction (avant génération d'étiquette)
router.post('/:transactionId/cancel', TransactionController.cancelTransaction);

// Récupérer les détails d'une transaction
router.get('/:transactionId', TransactionController.getTransactionDetails);

export default router;