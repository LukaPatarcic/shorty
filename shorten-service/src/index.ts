import express from 'express';
import dotenv from 'dotenv';
import { initializeKafka } from './config/kafka';
import { UrlController } from './controllers/url.controller';
import { validateShortenServiceEnv } from '@shorty/shared';

dotenv.config();

validateShortenServiceEnv(process.env);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', UrlController.health);
app.post('/shorten', UrlController.shorten);

// Initialize connections
async function initialize() {
  try {
    // Initialize Kafka (this will create topics and connect producer)
    await initializeKafka();
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

initialize().catch(console.error); 