import { Router } from 'express';
import { StripeController } from '../controllers/StripeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// ==========================================
// PUBLIC
// ==========================================

// Clé publique Stripe (pas besoin d'auth)
router.get('/public-key', StripeController.getPublicKey);

// Webhook Stripe (raw body nécessaire, pas d'auth)
router.post('/webhook', StripeController.handleWebhook);

// ==========================================
// STRIPE CONNECT - Onboarding vendeur
// ==========================================

// Créer un compte Stripe Connect Standard
router.post('/connect/create-account', authenticate, StripeController.createConnectedAccount);

// Créer un lien d'onboarding (le vendeur sera redirigé vers Stripe)
router.post('/connect/onboarding-link', authenticate, StripeController.createOnboardingLink);

// Créer un lien vers le dashboard Stripe du vendeur
router.get('/connect/dashboard-link', authenticate, StripeController.createDashboardLink);

// Récupérer le statut du compte Stripe Connect
router.get('/connect/status', authenticate, StripeController.getAccountStatus);

// ==========================================
// PAIEMENTS
// ==========================================

// Créer un Payment Intent (avec transfert automatique au vendeur)
router.post('/create-payment-intent', authenticate, StripeController.createPaymentIntent);

// Confirmer un paiement
router.post('/confirm-payment', authenticate, StripeController.confirmPayment);

export default router;
