"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
});
const SELLER_FEE_PERCENT = 5;
const BUYER_FEE_PERCENT = 5;
class StripeService {
    static async createConnectedAccount(userId, email, country = 'FR') {
        try {
            const existingAccount = await prisma.stripeAccount.findUnique({
                where: { userId }
            });
            if (existingAccount) {
                return {
                    success: true,
                    accountId: existingAccount.stripeAccountId,
                    onboardingUrl: await this.createOnboardingLink(existingAccount.stripeAccountId)
                };
            }
            const account = await stripe.accounts.create({
                type: 'express',
                country,
                email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
            });
            await prisma.stripeAccount.create({
                data: {
                    userId,
                    stripeAccountId: account.id,
                    accountType: 'express',
                    country,
                    currency: 'eur',
                }
            });
            const onboardingUrl = await this.createOnboardingLink(account.id);
            return {
                success: true,
                accountId: account.id,
                onboardingUrl
            };
        }
        catch (error) {
            console.error('[Stripe] Failed to create connected account:', error);
            throw new Error(`Failed to create Stripe account: ${error.message}`);
        }
    }
    static async createOnboardingLink(accountId) {
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.FRONTEND_URL}/seller/onboarding/refresh`,
            return_url: `${process.env.FRONTEND_URL}/seller/onboarding/complete`,
            type: 'account_onboarding',
        });
        return accountLink.url;
    }
    static async getAccountStatus(accountId) {
        try {
            const account = await stripe.accounts.retrieve(accountId);
            await prisma.stripeAccount.update({
                where: { stripeAccountId: accountId },
                data: {
                    chargesEnabled: account.charges_enabled,
                    payoutsEnabled: account.payouts_enabled,
                    detailsSubmitted: account.details_submitted,
                    onboardingComplete: account.charges_enabled && account.payouts_enabled,
                }
            });
            return {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                requirements: account.requirements,
            };
        }
        catch (error) {
            console.error('[Stripe] Failed to get account status:', error);
            throw new Error(`Failed to get account status: ${error.message}`);
        }
    }
    static async createPaymentIntent(productId, buyerId, sellerId, productPrice, currency = 'eur') {
        try {
            const sellerStripeAccount = await prisma.stripeAccount.findUnique({
                where: { userId: sellerId }
            });
            const useStripeConnect = sellerStripeAccount && sellerStripeAccount.chargesEnabled;
            if (sellerStripeAccount && !sellerStripeAccount.chargesEnabled) {
                throw new Error('Le compte Stripe du vendeur n\'est pas encore activé');
            }
            const productPriceInCents = Math.round(productPrice * 100);
            const sellerFeeInCents = Math.round(productPriceInCents * (SELLER_FEE_PERCENT / 100));
            const buyerFeeInCents = Math.round(productPriceInCents * (BUYER_FEE_PERCENT / 100));
            const sellerAmountInCents = productPriceInCents - sellerFeeInCents;
            const totalChargeInCents = productPriceInCents + buyerFeeInCents;
            const platformFeeInCents = sellerFeeInCents + buyerFeeInCents;
            const paymentIntentParams = {
                amount: totalChargeInCents,
                currency,
                metadata: {
                    productId,
                    buyerId,
                    sellerId,
                    productPrice: productPrice.toFixed(2),
                    sellerFee: (sellerFeeInCents / 100).toFixed(2),
                    buyerFee: (buyerFeeInCents / 100).toFixed(2),
                    platformFee: (platformFeeInCents / 100).toFixed(2),
                    sellerAmount: (sellerAmountInCents / 100).toFixed(2),
                }
            };
            if (useStripeConnect && sellerStripeAccount) {
                paymentIntentParams.application_fee_amount = platformFeeInCents;
                paymentIntentParams.transfer_data = {
                    destination: sellerStripeAccount.stripeAccountId,
                };
            }
            const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
            await prisma.transaction.create({
                data: {
                    productId,
                    buyerId,
                    amount: totalChargeInCents / 100,
                    currency: currency.toUpperCase(),
                    platformFee: platformFeeInCents / 100,
                    sellerAmount: sellerAmountInCents / 100,
                    paymentIntentId: paymentIntent.id,
                    status: 'PENDING',
                }
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                productPrice: productPrice,
                buyerFee: buyerFeeInCents / 100,
                totalCharge: totalChargeInCents / 100,
                sellerFee: sellerFeeInCents / 100,
                sellerAmount: sellerAmountInCents / 100,
                platformFee: platformFeeInCents / 100,
            };
        }
        catch (error) {
            console.error('[Stripe] Failed to create payment intent:', error);
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }
    static async confirmPayment(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            const status = paymentIntent.status === 'succeeded' ? 'SUCCEEDED' :
                paymentIntent.status === 'processing' ? 'PROCESSING' :
                    paymentIntent.status === 'canceled' ? 'CANCELLED' : 'FAILED';
            await prisma.transaction.update({
                where: { paymentIntentId },
                data: {
                    status,
                    transferId: typeof paymentIntent.transfer_data?.destination === 'string'
                        ? paymentIntent.transfer_data.destination
                        : paymentIntent.transfer_data?.destination?.id || null,
                }
            });
            if (status === 'SUCCEEDED') {
                const transaction = await prisma.transaction.findUnique({
                    where: { paymentIntentId }
                });
                if (transaction) {
                    await prisma.product.update({
                        where: { id: transaction.productId },
                        data: { status: 'SOLD' }
                    });
                }
            }
            return { status, paymentIntent };
        }
        catch (error) {
            console.error('[Stripe] Failed to confirm payment:', error);
            throw new Error(`Failed to confirm payment: ${error.message}`);
        }
    }
    static async refundPayment(paymentIntentId, reason) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                reason: reason,
            });
            await prisma.transaction.update({
                where: { paymentIntentId },
                data: { status: 'REFUNDED' }
            });
            const transaction = await prisma.transaction.findUnique({
                where: { paymentIntentId }
            });
            if (transaction) {
                await prisma.product.update({
                    where: { id: transaction.productId },
                    data: { status: 'ACTIVE' }
                });
            }
            return { refund };
        }
        catch (error) {
            console.error('[Stripe] Failed to refund payment:', error);
            throw new Error(`Failed to refund payment: ${error.message}`);
        }
    }
    static async handleWebhook(event) {
        try {
            switch (event.type) {
                case 'account.updated': {
                    const account = event.data.object;
                    await prisma.stripeAccount.update({
                        where: { stripeAccountId: account.id },
                        data: {
                            chargesEnabled: account.charges_enabled,
                            payoutsEnabled: account.payouts_enabled,
                            detailsSubmitted: account.details_submitted,
                            onboardingComplete: account.charges_enabled && account.payouts_enabled,
                        }
                    });
                    break;
                }
                case 'payment_intent.succeeded': {
                    const paymentIntent = event.data.object;
                    await this.confirmPayment(paymentIntent.id);
                    break;
                }
                case 'payment_intent.payment_failed': {
                    const paymentIntent = event.data.object;
                    await prisma.transaction.update({
                        where: { paymentIntentId: paymentIntent.id },
                        data: { status: 'FAILED' }
                    });
                    break;
                }
                case 'charge.refunded': {
                    const charge = event.data.object;
                    if (charge.payment_intent) {
                        await prisma.transaction.update({
                            where: { paymentIntentId: charge.payment_intent },
                            data: { status: 'REFUNDED' }
                        });
                    }
                    break;
                }
                default:
                    console.log(`[Stripe] Unhandled event type: ${event.type}`);
            }
            return { received: true };
        }
        catch (error) {
            console.error('[Stripe] Webhook handling failed:', error);
            throw error;
        }
    }
    static async createDashboardLink(accountId) {
        try {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            return loginLink.url;
        }
        catch (error) {
            console.error('[Stripe] Failed to create dashboard link:', error);
            throw new Error(`Failed to create dashboard link: ${error.message}`);
        }
    }
}
exports.StripeService = StripeService;
exports.default = StripeService;
//# sourceMappingURL=StripeService.js.map