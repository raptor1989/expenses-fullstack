import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

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

interface TokenPayload {
    id: string;
    email: string;
    tokenVersion?: number;
}

function readToken(req: Request): string | undefined {
    const cookieToken = req.cookies?.token;
    const headerToken = req.header('Authorization')?.replace('Bearer ', '');
    return cookieToken || headerToken;
}

// Returns the user behind a token, or null when the token is invalid, expired, or was issued
// before the user's last password reset (token_version moved on). Database errors propagate.
async function resolveUser(token: string): Promise<Request['user'] | null> {
    let decoded: TokenPayload;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
        return null;
    }

    const currentVersion = await UserModel.findTokenVersion(decoded.id);
    // Tokens issued before token versions existed carry none and count as version 0.
    if (currentVersion === null || currentVersion !== (decoded.tokenVersion ?? 0)) {
        return null;
    }

    return { id: decoded.id, email: decoded.email };
}

// The routers call these without returning the promise, so they must never reject:
// database errors go to `next(error)` (500), not to a 401 that would log the user out.
export const auth = async (req: Request, res: Response, next: NextFunction) => {
    const token = readToken(req);

    if (!token) {
        return res.status(401).json({
            message: 'Authentication required',
            code: 'auth_required'
        });
    }

    let user: Request['user'] | null;
    try {
        user = await resolveUser(token);
    } catch (error) {
        return next(error);
    }

    if (!user) {
        return res.status(401).json({
            message: 'Invalid or expired token',
            code: 'invalid_token'
        });
    }

    req.user = user;
    next();
};

// Like `auth`, but never rejects: a missing/invalid token just means
// `req.user` stays undefined. For endpoints where "not logged in" is a
// normal state to report (e.g. checking for an existing session), not an
// auth failure.
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = readToken(req);

    if (token) {
        try {
            req.user = (await resolveUser(token)) ?? undefined;
        } catch (error) {
            return next(error);
        }
    }

    next();
};
