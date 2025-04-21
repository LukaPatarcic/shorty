import express from 'express';
import dotenv from 'dotenv';
import { consumer, initializeKafka } from './config/kafka';
import { esClient } from './config/elasticsearch';
import { setupElasticsearch } from './config/elasticsearch';
import { AnalyticsController } from './controllers/analytics.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Connect to Kafka and subscribe to topics
async function setupKafkaConsumer() {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;
      
      const data = JSON.parse(message.value.toString());

      // Store click event
      try {
        await esClient.index({
          index: 'url-clicks',
          document: {
            shortUrl: data.data.shortUrl,
            timestamp: new Date(),
            userAgent: data.data.userAgent || 'unknown',
            ipAddress: data.data.ipAddress || '0.0.0.0',
            referer: data.data.referer || 'unknown'
          }
        });
        console.log(`Processed click event for: ${data.data.shortUrl}`);
      } catch (error) {
        console.error('Error indexing click event:', error);
      }
    },
  });
}

// API endpoints
app.get('/analytics/:shortUrl', AnalyticsController.getAnalytics);
app.get('/health', AnalyticsController.health);

// Start the server
async function initialize() {
  try {
    await setupElasticsearch();
    await initializeKafka();
    await setupKafkaConsumer();
    
    app.listen(port, () => {
      console.log(`Analytics service listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down...');
  await consumer.disconnect();
  await esClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down...');
  await consumer.disconnect();
  await esClient.close();
  process.exit(0);
});

initialize().catch(console.error); 