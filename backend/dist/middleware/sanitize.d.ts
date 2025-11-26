import { Request, Response, NextFunction } from 'express';
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeFields: (...fields: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=sanitize.d.ts.map