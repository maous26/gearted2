import { Request, Response } from 'express';
export declare class MondialRelayController {
    static searchPickupPoints(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getShippingRates(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static createLabel(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getTracking(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=MondialRelayController.d.ts.map