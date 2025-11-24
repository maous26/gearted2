import express from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = express.Router();

/**
 * Route webhook Stripe
 * IMPORTANT: Cette route NE DOIT PAS utiliser express.json() car Stripe
 * envoie le body en raw format pour la vérification de signature
 */
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  WebhookController.handleStripeWebhook
);

export default router;
