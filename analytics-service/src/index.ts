import express from 'express';
import dotenv from 'dotenv';
import { consumer, initializeKafka } from './config/kafka';
import { esClient, esIndices } from './config/elasticsearch';
import { setupElasticsearch } from './config/elasticsearch';
import { AnalyticsController } from './controllers/analytics.controller';
import { time } from 'console';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Connect to Kafka and subscribe to topics
async function setupKafkaConsumer() {
  consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      
      const data = JSON.parse(message.value.toString());

      const { originalUrl, code, timestamp, userAgent, ipAddress, referer } = data.data;

      console.log(data);

      try {
        await esClient.index({
          index: esIndices.urlClicks,
          document: {
            originalUrl,
            code,
            timestamp: new Date(timestamp),
            userAgent: userAgent || 'unknown',
            ipAddress: ipAddress || '0.0.0.0',
            referer: referer || 'unknown'
          }
        });

        await esClient.index({
          index: esIndices.urlMetadata,
          document: {
            originalUrl: originalUrl,
            code: code,
            createdAt: new Date(),
          }
        });

        console.log(`Processed click event for: ${data.data.code}`);
      } catch (error) {
        console.error('Error indexing click event:', error);
      }
    },
  });
}

// API endpoints
app.get('/analytics/:code', AnalyticsController.getAnalytics);
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