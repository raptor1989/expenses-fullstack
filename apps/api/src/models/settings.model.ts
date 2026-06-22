import { SupportedCurrency, ThemeMode, UserSettings } from '@expenses/shared';
import pool from '../db/index';

export class SettingsModel {
    static async findByUserId(userId: string): Promise<UserSettings | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT user_id as "userId", currency, theme, created_at as "createdAt", updated_at as "updatedAt"
        FROM user_settings
        WHERE user_id = $1
      `;

            const result = await client.query(query, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async update(
        userId: string,
        updateData: { currency?: SupportedCurrency; theme?: ThemeMode }
    ): Promise<UserSettings | null> {
        const client = await pool.connect();

        try {
            const { currency, theme } = updateData;

            const updateFields = [];
            const values = [userId];
            let valueCounter = 2;

            if (currency !== undefined) {
                updateFields.push(`currency = $${valueCounter++}`);
                values.push(currency);
            }

            if (theme !== undefined) {
                updateFields.push(`theme = $${valueCounter++}`);
                values.push(theme);
            }

            if (updateFields.length === 0) {
                return await this.findByUserId(userId);
            }

            const query = `
        UPDATE user_settings
        SET ${updateFields.join(', ')}
        WHERE user_id = $1
        RETURNING user_id as "userId", currency, theme, created_at as "createdAt", updated_at as "updatedAt"
      `;

            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }
}
