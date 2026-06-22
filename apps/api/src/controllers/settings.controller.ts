import { Request, Response } from 'express';
import { SettingsModel } from '../models/settings.model';

export class SettingsController {
    static async getSettings(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const settings = await SettingsModel.findByUserId(req.user.id);

            if (!settings) {
                return res.status(404).json({
                    message: 'Settings not found',
                    code: 'settings_not_found'
                });
            }

            res.status(200).json({ settings });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({
                message: 'Failed to get settings',
                code: 'settings_fetch_failed'
            });
        }
    }

    static async updateSettings(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { currency, theme } = req.body;

            const updatedSettings = await SettingsModel.update(req.user.id, { currency, theme });

            if (!updatedSettings) {
                return res.status(404).json({
                    message: 'Settings not found',
                    code: 'settings_not_found'
                });
            }

            res.status(200).json({
                message: 'Settings updated successfully',
                settings: updatedSettings
            });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                message: 'Failed to update settings',
                code: 'settings_update_failed'
            });
        }
    }
}
