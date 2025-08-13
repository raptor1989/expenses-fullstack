import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: Record<string, unknown>;
}

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'server_error';

    res.status(statusCode).json({
        message: err.message || 'Internal server error',
        code: errorCode,
        details: err.details || undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
