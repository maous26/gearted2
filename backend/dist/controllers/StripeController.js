"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const StripeService_1 = require("../services/StripeService");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
});
const STRIPE_CONNECT_ENABLED = true;
class StripeController {
    static async createConnectedAccount(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { email, country = 'FR' } = req.body;
            const result = await StripeService_1.StripeService.createConnectedAccount(userId, email, country);
            return res.json(result);
        }
        catch (error) {
            console.error('[Stripe] Create account error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getAccountStatus(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const stripeAccount = await prisma.stripeAccount.findUnique({
                where: { userId }
            });
            if (!stripeAccount) {
                return res.json({
                    success: true,
                    hasAccount: false
                });
            }
            const status = await StripeService_1.StripeService.getAccountStatus(stripeAccount.stripeAccountId);
            return res.json({
                success: true,
                hasAccount: true,
                accountId: stripeAccount.stripeAccountId,
                ...status,
                onboardingComplete: stripeAccount.onboardingComplete
            });
        }
        catch (error) {
            console.error('[Stripe] Get status error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async createOnboardingLink(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const stripeAccount = await prisma.stripeAccount.findUnique({
                where: { userId }
            });
            if (!stripeAccount) {
                return res.status(404).json({ error: 'Stripe account not found' });
            }
            const onboardingUrl = await StripeService_1.StripeService.createOnboardingLink(stripeAccount.stripeAccountId);
            return res.json({
                success: true,
                onboardingUrl
            });
        }
        catch (error) {
            console.error('[Stripe] Create onboarding link error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async getDashboardLink(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const stripeAccount = await prisma.stripeAccount.findUnique({
                where: { userId }
            });
            if (!stripeAccount) {
                return res.status(404).json({ error: 'Stripe account not found' });
            }
            const dashboardUrl = await StripeService_1.StripeService.createDashboardLink(stripeAccount.stripeAccountId);
            return res.json({
                success: true,
                dashboardUrl
            });
        }
        catch (error) {
            console.error('[Stripe] Get dashboard link error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async createPaymentIntent(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const { productId, amount, currency = 'eur' } = req.body;
            if (!productId || !amount) {
                return res.status(400).json({ error: 'Product ID and amount are required' });
            }
            const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
            const prisma = new PrismaClient();
            const product = await prisma.product.findUnique({
                where: { id: productId },
                include: { seller: true }
            });
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            if (product.sellerId === userId) {
                return res.status(400).json({ error: 'You cannot buy your own product' });
            }
            if (product.status === 'SOLD') {
                return res.status(400).json({ error: 'This product is already sold' });
            }
            const result = await StripeService_1.StripeService.createPaymentIntent(productId, userId, product.sellerId, amount, currency);
            return res.json({
                success: true,
                ...result
            });
        }
        catch (error) {
            console.error('[Stripe] Create payment intent error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async confirmPayment(req, res) {
        try {
            const { paymentIntentId } = req.body;
            if (!paymentIntentId) {
                return res.status(400).json({ error: 'Payment Intent ID is required' });
            }
            const result = await StripeService_1.StripeService.confirmPayment(paymentIntentId);
            return res.json({
                success: true,
                status: result.status
            });
        }
        catch (error) {
            console.error('[Stripe] Confirm payment error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    static async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        try {
            const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
            console.log(`[Stripe] Webhook received: ${event.type}`);
            await StripeService_1.StripeService.handleWebhook(event);
            return res.json({ received: true });
        }
        catch (error) {
            console.error('[Stripe] Webhook error:', error.message);
            return res.status(400).json({
                error: `Webhook Error: ${error.message}`
            });
        }
    }
    static getPublicKey(req, res) {
        return res.json({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
        });
    }
}
exports.StripeController = StripeController;
exports.default = StripeController;
//# sourceMappingURL=StripeController.js.map