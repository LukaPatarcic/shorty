import { Kafka, Partitioners } from 'kafkajs';
import dotenv from 'dotenv';
import { TOPICS } from '@shorty/shared';

dotenv.config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'analytics-service',
  brokers: (process.env.KAFKA_BROKER || 'kafka:9092').split(','),
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

    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  } finally {
    await admin.disconnect();
  }
}


export { kafka, consumer }; 