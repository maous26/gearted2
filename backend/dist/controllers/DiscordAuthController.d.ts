import { Request, Response } from 'express';
export declare class DiscordAuthController {
    static getAuthUrl(req: Request, res: Response): Response<any, Record<string, any>>;
    static callback(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
    static logout(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=DiscordAuthController.d.ts.map