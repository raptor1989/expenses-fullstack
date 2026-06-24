import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const cookieToken = req.cookies?.token;
        const headerToken = req.header('Authorization')?.replace('Bearer ', '');
        const token = cookieToken || headerToken;

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'auth_required'
            });
        }

        const secretKey = process.env.JWT_SECRET!;

        const decoded = jwt.verify(token, secretKey) as {
            id: string;
            email: string;
        };

        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            message: 'Invalid or expired token',
            code: 'invalid_token'
        });
    }
};

// Like `auth`, but never rejects: a missing/invalid token just means
// `req.user` stays undefined. For endpoints where "not logged in" is a
// normal state to report (e.g. checking for an existing session), not an
// auth failure.
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const cookieToken = req.cookies?.token;
        const headerToken = req.header('Authorization')?.replace('Bearer ', '');
        const token = cookieToken || headerToken;

        if (token) {
            const secretKey = process.env.JWT_SECRET!;
            const decoded = jwt.verify(token, secretKey) as {
                id: string;
                email: string;
            };

            req.user = {
                id: decoded.id,
                email: decoded.email
            };
        }
    } catch (error) {
        console.error('Optional auth middleware error:', error);
    }

    next();
};
