import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

startServer();
