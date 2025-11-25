import { Request, Response } from 'express';
export declare class WebhookController {
    static handleStripeWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    private static handlePaymentSuccess;
    private static handlePaymentFailed;
    private static handlePaymentCanceled;
    private static handleRefund;
}
//# sourceMappingURL=WebhookController.d.ts.map