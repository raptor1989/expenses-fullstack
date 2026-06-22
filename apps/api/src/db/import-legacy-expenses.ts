import fs from 'fs';
import path from 'path';
import pool, { testConnection } from './index';

// Edit these before running. LEGACY_USER_ID must be an existing user UUID,
// and each CATEGORY_MAP value must be a category UUID owned by that user.
const LEGACY_USER_ID = '32abc717-f147-4d7b-ba17-cc0798f9f8dd';
const CATEGORY_MAP: Record<number, string> = {
    1: '538d8462-7a2e-4feb-88a7-ae9bde9d2498',
    2: '964b23e7-fac7-44cb-8d3d-b52715084043',
    3: '03646b27-b10a-4a62-a786-f0c114df4049'
};

const FUEL_CATEGORY_ID = '18322cbd-5c6c-417e-a439-c02c03f9296a';

const CSV_PATH = path.join(__dirname, 'data-1782128424527.csv');
const DRY_RUN = process.argv.includes('--dry-run');

const FUEL_KEYWORDS_REGEX = /paliwo|lpg/i;

const resolveCategoryId = (legacyCategory: number, description: string): string => {
    if (legacyCategory === 3 && FUEL_KEYWORDS_REGEX.test(description)) {
        return FUEL_CATEGORY_ID;
    }

    return CATEGORY_MAP[legacyCategory];
};

interface LegacyRow {
    legacyCategory: number;
    categoryId: string;
    amount: number;
    description: string;
    date: string;
}

const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else if (char === '"') {
            inQuotes = true;
        } else if (char === ',') {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    fields.push(current);
    return fields;
};

const loadRows = (): LegacyRow[] => {
    const lines = fs
        .readFileSync(CSV_PATH, 'utf-8')
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);

    const [, ...dataLines] = lines;

    return dataLines.map((line) => {
        const [, categoryStr, amountStr, title, date] = parseCsvLine(line);
        const legacyCategory = parseInt(categoryStr, 10);

        return {
            legacyCategory,
            categoryId: resolveCategoryId(legacyCategory, title),
            amount: parseFloat(amountStr),
            description: title,
            date
        };
    });
};

const validate = async (rows: LegacyRow[]): Promise<Map<string, string>> => {
    const client = await pool.connect();

    try {
        const userResult = await client.query('SELECT id FROM users WHERE id = $1', [LEGACY_USER_ID]);

        if (userResult.rows.length === 0) {
            throw new Error(`User ${LEGACY_USER_ID} does not exist`);
        }

        const legacyCategoriesInCsv = new Set(rows.map((row) => row.legacyCategory));

        for (const legacyCategory of legacyCategoriesInCsv) {
            if (!CATEGORY_MAP[legacyCategory]) {
                const count = rows.filter((row) => row.legacyCategory === legacyCategory).length;
                throw new Error(`No mapping for legacy category ${legacyCategory} (${count} rows)`);
            }
        }

        const categoryIdsUsed = new Set(rows.map((row) => row.categoryId));
        const categoryNamesById = new Map<string, string>();

        for (const categoryId of categoryIdsUsed) {
            const categoryResult = await client.query(
                'SELECT name FROM categories WHERE id = $1 AND user_id = $2',
                [categoryId, LEGACY_USER_ID]
            );

            if (categoryResult.rows.length === 0) {
                throw new Error(`Category ${categoryId} does not exist for user ${LEGACY_USER_ID}`);
            }

            categoryNamesById.set(categoryId, categoryResult.rows[0].name);
        }

        return categoryNamesById;
    } finally {
        client.release();
    }
};

const printDryRunSummary = (rows: LegacyRow[], categoryNamesById: Map<string, string>) => {
    console.log(`Total rows: ${rows.length}`);

    const categoryIdsUsed = [...new Set(rows.map((row) => row.categoryId))];

    for (const categoryId of categoryIdsUsed) {
        const rowsForCategory = rows.filter((row) => row.categoryId === categoryId);
        const total = rowsForCategory.reduce((sum, row) => sum + row.amount, 0);
        const categoryName = categoryNamesById.get(categoryId);

        console.log(
            `  ${categoryId} ("${categoryName}"): ${rowsForCategory.length} rows, total ${total.toFixed(2)}`
        );
    }
};

const importRows = async (rows: LegacyRow[]) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const row of rows) {
            await client.query(
                `INSERT INTO expenses (amount, description, date, category_id, user_id)
         VALUES ($1, $2, $3, $4, $5)`,
                [row.amount, row.description, row.date, row.categoryId, LEGACY_USER_ID]
            );
        }

        await client.query('COMMIT');
        console.log(`Imported ${rows.length} expenses for user ${LEGACY_USER_ID}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const run = async () => {
    try {
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('Failed to connect to database. Aborting.');
            process.exit(1);
        }

        const rows = loadRows();
        const categoryNamesById = await validate(rows);

        if (DRY_RUN) {
            console.log('Dry run - no changes will be made to the database.');
            printDryRunSummary(rows, categoryNamesById);
        } else {
            await importRows(rows);
        }
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
};

run().then(() => {
    console.log('Import process finished');
    process.exit(0);
});
