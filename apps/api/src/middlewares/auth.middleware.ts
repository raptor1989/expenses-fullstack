import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                username: string;
            };
        }
    }
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

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
            username: string;
        };

        req.user = {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username
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
