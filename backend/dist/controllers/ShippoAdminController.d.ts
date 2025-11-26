import { Request, Response } from 'express';
export declare class ShippoAdminController {
    static listCarriers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getCarriersSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static connectColissimo(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static connectMondialRelay(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static connectChronopost(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static setupAllCarriers(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateCarrier(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteCarrier(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getCarriersByName(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ShippoAdminController.d.ts.map