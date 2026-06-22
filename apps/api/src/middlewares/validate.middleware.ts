import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: 'Validation failed',
            code: 'validation_error',
            details: errors.array().reduce(
                (acc, err) => {
                    acc[err.type === 'field' ? err.path : err.type] = err.msg;
                    return acc;
                },
                {} as Record<string, string>
            )
        });
        return;
    }
    next();
};
