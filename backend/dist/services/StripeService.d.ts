import Stripe from 'stripe';
export declare class StripeService {
    static createConnectedAccount(userId: string, email: string, country?: string): Promise<{
        success: boolean;
        accountId: string;
        onboardingUrl: string;
    }>;
    static createOnboardingLink(accountId: string): Promise<string>;
    static getAccountStatus(accountId: string): Promise<{
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
        requirements: Stripe.Account.Requirements | undefined;
    }>;
    static createPaymentIntent(productId: string, buyerId: string, sellerId: string, productPrice: number, currency?: string): Promise<{
        clientSecret: string | null;
        paymentIntentId: string;
        productPrice: number;
        buyerFee: number;
        totalCharge: number;
        sellerFee: number;
        sellerAmount: number;
        platformFee: number;
    }>;
    static confirmPayment(paymentIntentId: string): Promise<{
        status: string;
        paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
    }>;
    static refundPayment(paymentIntentId: string, reason?: string): Promise<{
        refund: Stripe.Response<Stripe.Refund>;
    }>;
    static handleWebhook(event: Stripe.Event): Promise<{
        received: boolean;
    }>;
    static createDashboardLink(accountId: string): Promise<string>;
}
export default StripeService;
//# sourceMappingURL=StripeService.d.ts.map