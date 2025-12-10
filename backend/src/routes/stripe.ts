import { Router } from 'express';
import { StripeController } from '../controllers/StripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Clé publique Stripe (pas besoin d'auth)
router.get('/public-key', StripeController.getPublicKey);

// MODÈLE C2C: Les routes Stripe Connect vendeur ont été supprimées
// Gearted collecte tous les paiements sur son compte Stripe unique
// Les vendeurs reçoivent leurs paiements via virement IBAN

// Routes de paiement
router.post('/create-payment-intent', authenticate, StripeController.createPaymentIntent);
router.post('/confirm-payment', authenticate, StripeController.confirmPayment);

// Webhook Stripe (raw body nécessaire, pas d'auth)
router.post('/webhook', StripeController.handleWebhook);

export default router;
