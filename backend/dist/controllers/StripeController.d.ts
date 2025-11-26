import { Request, Response } from 'express';
export declare class StripeController {
    static createConnectedAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getAccountStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createOnboardingLink(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getDashboardLink(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createPaymentIntent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static confirmPayment(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static handleWebhook(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getPublicKey(req: Request, res: Response): Response<any, Record<string, any>>;
}
export default StripeController;
//# sourceMappingURL=StripeController.d.ts.map