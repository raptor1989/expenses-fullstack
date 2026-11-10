import dotenv from 'dotenv';

dotenv.config({ quiet: true });

import app from './app';

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !process.env.SMTP_HOST) {
    console.warn('SMTP_HOST is not set: password reset links are written to the log instead of being emailed.');
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
