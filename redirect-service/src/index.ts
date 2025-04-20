import express from 'express';
import dotenv from 'dotenv';
import { RedirectController } from './controllers/redirect.controller';
import { KafkaService } from './services/kafka.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

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
      console.log(`Redirect service is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down...');
  await KafkaService.stopServices();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down...');
  await KafkaService.stopServices();
  process.exit(0);
});

initialize().catch(console.error); 