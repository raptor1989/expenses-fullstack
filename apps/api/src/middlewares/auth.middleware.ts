import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request interface to include user property
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

        // Verify token
        const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

        const decoded = jwt.verify(token, secretKey) as {
            id: string;
            email: string;
            username: string;
        };

        // Add user data to request object
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
