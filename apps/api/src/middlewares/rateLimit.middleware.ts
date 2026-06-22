import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    message: { message: 'Too many requests, please try again later.', code: 'rate_limit_exceeded' },
    standardHeaders: true,
    legacyHeaders: false
});
