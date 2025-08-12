import express from 'express';
import { UserController } from '../controllers/user.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/register', (req, res) => {
    UserController.register(req, res);
});

router.post('/login', (req, res) => {
    UserController.login(req, res);
});

router.get(
    '/profile',
    (req, res, next) => {
        auth(req, res, next);
    },
    (req, res) => {
        UserController.getProfile(req, res);
    }
);

router.put(
    '/profile',
    (req, res, next) => {
        auth(req, res, next);
    },
    (req, res) => {
        UserController.updateProfile(req, res);
    }
);

export const userRoutes = router;
