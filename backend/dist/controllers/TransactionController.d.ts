import { Request, Response } from 'express';
export declare class TransactionController {
    static getMySales(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getMyPurchases(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getTransactionDetails(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=TransactionController.d.ts.map