import express from 'express';
import dotenv from 'dotenv';
import { RedirectController } from './controllers/redirect.controller';
import { KafkaService } from './services/kafka.service';
import { env } from './config/env';
import logger from './config/logger';

dotenv.config();

const app = express();
const port = env.PORT || 3001;

// Health check endpoint
app.get('/health', RedirectController.health);

// Redirect endpoint
app.get('/:code', RedirectController.redirect);

// Initialize Kafka consumer and start server
async function initialize() {
  try {
    // Start Kafka services
    await KafkaService.startServices();
    
    // Start the server
    app.listen(port, () => {
      logger.info(`Redirect service is running on port ${port}`);
    });
  } catch (error) {
    logger.error({
      message: 'Failed to initialize',
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received. Shutting down...');
  await KafkaService.stopServices();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Shutting down...');
  await KafkaService.stopServices();
  process.exit(0);
});

initialize().catch((error) => {
  logger.error({
    message: 'Failed to initialize',
    error,
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
}); 