import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { rolesRouter } from './routes/roles';
import { clientsRouter } from './routes/clients';
import { parametersRouter } from './routes/parameters';
import { templatesRouter } from './routes/templates';
import { quotesRouter } from './routes/quotes';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/parameters', parametersRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
