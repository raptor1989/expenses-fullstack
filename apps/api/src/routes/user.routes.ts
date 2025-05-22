import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/users/register - Register a new user
router.post('/register', (req, res) => {
    UserController.register(req, res);
});

// POST /api/users/login - Login a user
router.post('/login', (req, res) => {
    UserController.login(req, res);
});

// GET /api/users/profile - Get current user profile
router.get(
    '/profile',
    (req, res, next) => {
        auth(req, res, next);
    },
    (req, res) => {
        UserController.getProfile(req, res);
    }
);

// PUT /api/users/profile - Update user profile
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
