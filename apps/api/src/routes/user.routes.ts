import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { message: 'Too many attempts, please try again later.', code: 'rate_limit_exceeded' },
    standardHeaders: true,
    legacyHeaders: false
});

const registerValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().isLength({ max: 100 }).withMessage('First name too long'),
    body('lastName').optional().trim().isLength({ max: 100 }).withMessage('Last name too long')
];

const loginValidation = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

router.post('/register', authLimiter, registerValidation, validate, (req: Request, res: Response) => {
    UserController.register(req, res);
});

router.post('/login', authLimiter, loginValidation, validate, (req: Request, res: Response) => {
    UserController.login(req, res);
});

router.get(
    '/profile',
    (req: Request, res: Response, next: NextFunction) => {
        auth(req, res, next);
    },
    (req: Request, res: Response) => {
        UserController.getProfile(req, res);
    }
);

router.put(
    '/profile',
    (req: Request, res: Response, next: NextFunction) => {
        auth(req, res, next);
    },
    (req: Request, res: Response) => {
        UserController.updateProfile(req, res);
    }
);

router.put(
    '/password',
    (req: Request, res: Response, next: NextFunction) => {
        auth(req, res, next);
    },
    changePasswordValidation,
    validate,
    (req: Request, res: Response) => {
        UserController.changePassword(req, res);
    }
);

router.post(
    '/logout',
    (req: Request, res: Response, next: NextFunction) => {
        auth(req, res, next);
    },
    (req: Request, res: Response) => {
        UserController.logout(req, res);
    }
);

export const userRoutes = router;
