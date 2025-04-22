import express from 'express';
import dotenv from 'dotenv';
import { consumer, initializeKafka } from './config/kafka';
import { esClient, esIndices } from './config/elasticsearch';
import { setupElasticsearch } from './config/elasticsearch';
import { AnalyticsController } from './controllers/analytics.controller';
import logger from './config/logger';
import { env } from './config/env';
import './config/trace';
dotenv.config();

const app = express();
const port = env.PORT || 3002;

// Connect to Kafka and subscribe to topics
async function setupKafkaConsumer() {
  consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      
      try {
        const data = JSON.parse(message.value.toString());
        const { originalUrl, code, timestamp, userAgent, ipAddress, referer } = data.data;

        switch(data.type) {
          case 'url.clicked':
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
            break;
          case 'url.created':
            await esClient.index({
              index: esIndices.urlMetadata,
              document: {
                originalUrl: originalUrl,
                code: code,
                createdAt: new Date(),
              }
            });
            break;
          default:
            return;
        }
        
        logger.info({
          message: `Processed click event for: ${data.data.code}`,
          data: data
        });
      } catch (error) {
        logger.error({
          message: 'Error indexing click event',
          error,
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    },
  });
}

// API endpoints
app.get('/analytics/:code', AnalyticsController.getAnalytics);
app.get('/analytics/health', AnalyticsController.health);

// Start the server
async function initialize() {
  try {
    await setupElasticsearch();
    await initializeKafka();
    await setupKafkaConsumer();
    
    app.listen(port, () => {
      logger.info(`Analytics service listening on port ${port}`);
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
  await consumer.disconnect();
  await esClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received. Shutting down...');
  await consumer.disconnect();
  await esClient.close();
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