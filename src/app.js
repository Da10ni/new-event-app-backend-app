import express from 'express';
import cors from 'cors';
import corsOptions from './config/cors.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// CORS middleware
app.use(cors(corsOptions));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', routes);

// Error Handling
app.use(errorHandler);

export default app;
