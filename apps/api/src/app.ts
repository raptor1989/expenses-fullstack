import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { userRoutes } from './routes/user.routes';
import { expenseRoutes } from './routes/expense.routes';
import { categoryRoutes } from './routes/category.routes';
import { settingsRoutes } from './routes/settings.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.use('/expenses', expenseRoutes);
app.use('/categories', categoryRoutes);
app.use('/settings', settingsRoutes);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

app.use(notFound);
app.use(errorHandler);

export default app;
