import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { SettingsController } from '../controllers/settings.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { apiLimiter } from '../middlewares/rateLimit.middleware';

const router = express.Router();

router.use(apiLimiter);

router.use((req, res, next) => {
    auth(req, res, next);
});

// Kept in sync with shared's SUPPORTED_CURRENCIES by hand: @expenses/shared builds to an
// ESM-only bundle, which apps/api's CommonJS runtime can't `require()` for a real value import
// (type-only imports are fine since TypeScript erases them).
const SUPPORTED_CURRENCIES = ['PLN', 'USD', 'EUR', 'GBP'];

const settingsUpdateValidation = [
    body('currency')
        .optional()
        .isIn(SUPPORTED_CURRENCIES)
        .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`),
    body('theme').optional().isIn(['light', 'dark']).withMessage('Theme must be "light" or "dark"')
];

router.get('/', (req: Request, res: Response) => {
    SettingsController.getSettings(req, res);
});

router.put('/', settingsUpdateValidation, validate, (req: Request, res: Response) => {
    SettingsController.updateSettings(req, res);
});

export const settingsRoutes = router;
