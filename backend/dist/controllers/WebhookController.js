"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
});
class WebhookController {
    static async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !webhookSecret) {
            console.error('[Webhook] Missing signature or webhook secret');
            return res.status(400).send('Webhook signature or secret missing');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
        catch (err) {
            console.error('[Webhook] Signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        console.log(`[Webhook] Received event: ${event.type}`);
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await WebhookController.handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await WebhookController.handlePaymentFailed(event.data.object);
                    break;
                case 'payment_intent.canceled':
                    await WebhookController.handlePaymentCanceled(event.data.object);
                    break;
                case 'charge.refunded':
                    await WebhookController.handleRefund(event.data.object);
                    break;
                default:
                    console.log(`[Webhook] Unhandled event type: ${event.type}`);
            }
            return res.json({ received: true });
        }
        catch (error) {
            console.error('[Webhook] Error processing event:', error);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    static async handlePaymentSuccess(paymentIntent) {
        console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { paymentIntentId: paymentIntent.id },
                include: { product: true }
            });
            if (!transaction) {
                console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
                return;
            }
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'SUCCEEDED',
                }
            });
            const soldAt = new Date();
            const deletionScheduledAt = new Date(soldAt.getTime() + (3 * 24 * 60 * 60 * 1000));
            await prisma.product.update({
                where: { id: transaction.productId },
                data: {
                    status: 'SOLD',
                    soldAt: soldAt,
                    deletionScheduledAt: deletionScheduledAt
                }
            });
            console.log(`[Webhook] ✅ Product ${transaction.productId} marked as SOLD`);
            console.log(`[Webhook] ✅ Product will be deleted on ${deletionScheduledAt.toISOString()}`);
            console.log(`[Webhook] ✅ Transaction ${transaction.id} marked as SUCCEEDED`);
        }
        catch (error) {
            console.error('[Webhook] Error handling payment success:', error);
            throw error;
        }
    }
    static async handlePaymentFailed(paymentIntent) {
        console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { paymentIntentId: paymentIntent.id }
            });
            if (!transaction) {
                console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
                return;
            }
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'FAILED',
                    metadata: {
                        ...(transaction.metadata || {}),
                        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error'
                    }
                }
            });
            console.log(`[Webhook] ❌ Transaction ${transaction.id} marked as FAILED`);
        }
        catch (error) {
            console.error('[Webhook] Error handling payment failure:', error);
            throw error;
        }
    }
    static async handlePaymentCanceled(paymentIntent) {
        console.log(`[Webhook] Payment canceled: ${paymentIntent.id}`);
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { paymentIntentId: paymentIntent.id }
            });
            if (!transaction) {
                console.error(`[Webhook] Transaction not found for PaymentIntent: ${paymentIntent.id}`);
                return;
            }
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'CANCELLED'
                }
            });
            console.log(`[Webhook] ⚠️ Transaction ${transaction.id} marked as CANCELLED`);
        }
        catch (error) {
            console.error('[Webhook] Error handling payment cancellation:', error);
            throw error;
        }
    }
    static async handleRefund(charge) {
        console.log(`[Webhook] Refund processed for charge: ${charge.id}`);
        try {
            const transaction = await prisma.transaction.findUnique({
                where: { paymentIntentId: charge.payment_intent },
                include: { product: true }
            });
            if (!transaction) {
                console.error(`[Webhook] Transaction not found for charge: ${charge.id}`);
                return;
            }
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'REFUNDED',
                    metadata: {
                        ...(transaction.metadata || {}),
                        refundedAt: new Date().toISOString(),
                        refundAmount: charge.amount_refunded
                    }
                }
            });
            await prisma.product.update({
                where: { id: transaction.productId },
                data: {
                    status: 'ACTIVE'
                }
            });
            console.log(`[Webhook] 💰 Transaction ${transaction.id} marked as REFUNDED`);
            console.log(`[Webhook] 🔄 Product ${transaction.productId} marked as ACTIVE again`);
        }
        catch (error) {
            console.error('[Webhook] Error handling refund:', error);
            throw error;
        }
    }
}
exports.WebhookController = WebhookController;
//# sourceMappingURL=WebhookController.js.map