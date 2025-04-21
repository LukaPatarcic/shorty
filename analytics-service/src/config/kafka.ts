import { Kafka } from 'kafkajs';
import { TOPICS } from '@shorty/shared';
import logger from './logger';
import { env } from './env';


// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: env.KAFKA_BROKERS || ['kafka:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const consumer = kafka.consumer({ groupId: 'analytics-service-group' });
const admin = kafka.admin();

// Initialize Kafka topics
export async function initializeKafka() {
  try {
    await admin.connect();
    
    // Subscribe to topics
    await consumer.connect();
    await consumer.subscribe({ topics: [TOPICS.URL_EVENTS], fromBeginning: true });

    logger.info('Kafka initialized successfully');
  } catch (error) {
    logger.error({
      message: 'Failed to initialize Kafka',
      error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    await admin.disconnect();
  }
}


export { kafka, consumer }; 