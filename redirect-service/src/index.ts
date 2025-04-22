import express from 'express';
import dotenv from 'dotenv';
import { RedirectController } from './controllers/redirect.controller';
import { KafkaService } from './services/kafka.service';
import { env } from './config/env';
import logger from './config/logger';
import './config/trace';

dotenv.config();

const app = express();
const port = env.PORT || 3001;

app.get('/redirect/health', RedirectController.health);
app.get('/redirect/:code', RedirectController.redirect);

async function initialize() {
  try {
    await KafkaService.startServices();
    
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