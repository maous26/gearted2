import { Router } from 'express';
import { StripeController } from '../controllers/StripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Clé publique Stripe (pas besoin d'auth)
router.get('/public-key', StripeController.getPublicKey);

// Routes Stripe Connect (nécessitent authentification)
router.post('/connect/account', authenticate, StripeController.createConnectedAccount);
router.get('/connect/status', authenticate, StripeController.getAccountStatus);
router.post('/connect/onboarding-link', authenticate, StripeController.createOnboardingLink);
router.get('/connect/dashboard', authenticate, StripeController.getDashboardLink);

// Routes de paiement
router.post('/create-payment-intent', authenticate, StripeController.createPaymentIntent);
router.post('/confirm-payment', authenticate, StripeController.confirmPayment);

// Webhook Stripe (raw body nécessaire, pas d'auth)
router.post('/webhook', StripeController.handleWebhook);

export default router;
