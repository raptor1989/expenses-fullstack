import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

export class UserController {
    // Register new user
    static async register(req: Request, res: Response) {
        try {
            const { username, email, password, firstName, lastName } = req.body;

            // Check if user already exists
            const existingUser = await UserModel.findByEmail(email);

            if (existingUser) {
                return res.status(400).json({
                    message: 'User with this email already exists',
                    code: 'email_in_use'
                });
            }

            // Create new user
            const user = await UserModel.create(username, email, password, firstName, lastName);

            // Generate JWT token
            const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
            const expiresIn: any = process.env.JWT_EXPIRES_IN || '7d';

            const signOption: jwt.SignOptions = {
                expiresIn
            };

            const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, secretKey, signOption);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                token
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                message: 'Failed to register user',
                code: 'registration_failed'
            });
        }
    }

    // Login user
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await UserModel.findByEmail(email);

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password',
                    code: 'invalid_credentials'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: 'Invalid email or password',
                    code: 'invalid_credentials'
                });
            }

            // Generate JWT token
            const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
                        const expiresIn: any = process.env.JWT_EXPIRES_IN || '7d';

            const signOption: jwt.SignOptions = {
                expiresIn
            };


            const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, secretKey, signOption);

            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                message: 'Failed to login',
                code: 'login_failed'
            });
        }
    }

    // Get current user profile
    static async getProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const user = await UserModel.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                    code: 'user_not_found'
                });
            }

            res.status(200).json({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                message: 'Failed to get user profile',
                code: 'profile_fetch_failed'
            });
        }
    }

    // Update user profile
    static async updateProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { firstName, lastName, email, username } = req.body;

            const updatedUser = await UserModel.update(req.user.id, {
                firstName,
                lastName,
                email,
                username
            });

            if (!updatedUser) {
                return res.status(404).json({
                    message: 'User not found',
                    code: 'user_not_found'
                });
            }

            res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                message: 'Failed to update user profile',
                code: 'profile_update_failed'
            });
        }
    }
}
