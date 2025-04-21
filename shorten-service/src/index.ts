import express from 'express';
import dotenv from 'dotenv';
import { initializeKafka } from './config/kafka';
import { UrlController } from './controllers/url.controller';
import { env } from './config/env';
import logger from './config/logger';
import './config/trace';

dotenv.config();

const app = express();
const port = env.PORT || 3000;

app.use(express.json());

app.get('/shorten/health', UrlController.health);
app.post('/shorten', UrlController.shorten);

// Initialize connections
async function initialize() {
  try {
    // Initialize Kafka (this will create topics and connect producer)
    await initializeKafka();
    
    // Start the server
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to initialize:', error);
    process.exit(1);
  }
}

initialize().catch(console.error); 