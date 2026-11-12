import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { isMailConfigured, sendPasswordResetEmail } from '../services/mail.service';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import ms from 'ms';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const passwordResetLogFile = path.join(__dirname, '../../logs/password-resets.log');

const isProduction = process.env.NODE_ENV === 'production';

// The JWT carries users.token_version, so bumping the column (password reset or change) revokes it.
function issueAuthCookie(res: Response, user: { id: string; email: string; tokenVersion: number }) {
    const expiresIn = (process.env.JWT_EXPIRES_IN as ms.StringValue) || '7D';
    const payload = { id: user.id, email: user.email, tokenVersion: user.tokenVersion };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: ms(expiresIn)
    });
}

export class UserController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const existingUser = await UserModel.findByEmail(email);

            if (existingUser) {
                return res.status(400).json({
                    message: 'User with this email already exists',
                    code: 'email_in_use'
                });
            }

            const user = await UserModel.create(email, password);

            issueAuthCookie(res, user);

            res.status(201).json({
                message: 'User registered successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                message: 'Failed to register user',
                code: 'registration_failed'
            });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await UserModel.findByEmail(email);

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid email or password',
                    code: 'invalid_credentials'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({
                    message: 'Invalid email or password',
                    code: 'invalid_credentials'
                });
            }

            issueAuthCookie(res, user);

            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                message: 'Failed to login',
                code: 'login_failed'
            });
        }
    }

    static logout(req: Request, res: Response) {
        res.clearCookie('token', { httpOnly: true, secure: isProduction, sameSite: 'strict' });
        res.status(200).json({ message: 'Logged out successfully' });
    }

    static async getSession(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(200).json({ user: null });
            }

            const user = await UserModel.findById(req.user.id);

            if (!user) {
                return res.status(200).json({ user: null });
            }

            res.status(200).json({
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error) {
            console.error('Get session error:', error);
            res.status(500).json({
                message: 'Failed to get session',
                code: 'session_fetch_failed'
            });
        }
    }

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
                    email: user.email,
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

    static async changePassword(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { currentPassword, newPassword } = req.body;

            const currentHash = await UserModel.findPasswordById(req.user.id);

            if (!currentHash) {
                return res.status(404).json({
                    message: 'User not found',
                    code: 'user_not_found'
                });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, currentHash);

            if (!isPasswordValid) {
                return res.status(400).json({
                    message: 'Current password is incorrect',
                    code: 'invalid_credentials'
                });
            }

            // Signs out every other session; this one gets a fresh cookie with the new token version.
            const { email, tokenVersion } = await UserModel.updatePassword(req.user.id, newPassword);
            issueAuthCookie(res, { id: req.user.id, email, tokenVersion });

            res.status(200).json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                message: 'Failed to change password',
                code: 'password_change_failed'
            });
        }
    }

    static async updateProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { email } = req.body;

            const existingUser = await UserModel.findByEmail(email);

            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    message: 'User with this email already exists',
                    code: 'email_in_use'
                });
            }

            const updatedUser = await UserModel.update(req.user.id, { email });

            if (!updatedUser) {
                return res.status(404).json({
                    message: 'User not found',
                    code: 'user_not_found'
                });
            }

            // The token carries the e-mail, so a fresh cookie keeps the session consistent with the profile.
            // It must keep the current token_version, or the new cookie would be revoked on arrival.
            const tokenVersion = (await UserModel.findTokenVersion(req.user.id)) ?? 0;
            issueAuthCookie(res, { id: updatedUser.id, email: updatedUser.email, tokenVersion });

            res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
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

    static async forgotPassword(req: Request, res: Response) {
        try {
            const { email } = req.body;

            const user = await UserModel.findByEmail(email);

            if (user) {
                const rawToken = crypto.randomBytes(32).toString('hex');
                const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

                await UserModel.setResetToken(email, tokenHash, expiresAt);

                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

                if (isMailConfigured()) {
                    // Not awaited: waiting for SMTP would make the answer for a registered email
                    // noticeably slower than for an unknown one.
                    sendPasswordResetEmail(email, resetLink)
                        .then(() => console.log(`Password reset email sent to ${email}`))
                        .catch((mailError) => console.error('Failed to send password reset email:', mailError));
                } else {
                    console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);

                    // Tests read the link from the console; the file is for a server running without SMTP.
                    if (process.env.NODE_ENV !== 'test') {
                        try {
                            await fs.mkdir(path.dirname(passwordResetLogFile), { recursive: true });
                            await fs.appendFile(
                                passwordResetLogFile,
                                `${new Date().toISOString()} ${email} ${resetLink}\n`
                            );
                        } catch (logError) {
                            console.error('Failed to persist password reset link:', logError);
                        }
                    }
                }
            }

            // Depends only on the server's mail setup, never on whether the email exists.
            res.status(200).json({
                message: isMailConfigured()
                    ? 'If that email is registered, you will receive a password reset link shortly. Check your inbox.'
                    : 'If that email is registered, a reset link has been created, but this server does not send e-mail. Ask the administrator for the link.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                message: 'Failed to process password reset request',
                code: 'forgot_password_failed'
            });
        }
    }

    static async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

            const user = await UserModel.findByResetTokenHash(tokenHash);

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token',
                    code: 'reset_token_invalid'
                });
            }

            if (!user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt) < new Date()) {
                return res.status(400).json({
                    message: 'Reset token has expired',
                    code: 'reset_token_expired'
                });
            }

            await UserModel.resetPassword(user.id, newPassword);

            res.status(200).json({ message: 'Password has been reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({
                message: 'Failed to reset password',
                code: 'password_reset_failed'
            });
        }
    }
}
