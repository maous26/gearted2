import { Request, Response } from 'express';
export declare class ShippingController {
    static addShippingAddress(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getShippingRates(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static purchaseLabel(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getTracking(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getPendingShipments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteShippingAddress(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getMyShippingAddresses(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ShippingController.d.ts.map