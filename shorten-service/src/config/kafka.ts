import { Kafka, Partitioners } from 'kafkajs';
import dotenv from 'dotenv';
import { env } from './env';
import { TOPICS } from '@shorty/shared';

dotenv.config();

// Silence the partitioner warning
process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1';

const kafka = new Kafka({
  clientId: 'shorty-service',
  brokers: env.KAFKA_BROKERS || ['localhost:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

const consumer = kafka.consumer({ groupId: 'shorty-service-group' });
const admin = kafka.admin();

// Initialize Kafka topics
export async function initializeKafka() {
  try {
    await admin.connect();
    
    // Create topics if they don't exist
    await admin.createTopics({
      topics: [{
        topic: TOPICS.URL_EVENTS,
        numPartitions: 1,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '604800000' } // 7 days retention
        ]
      }],
      waitForLeaders: true,
      timeout: 10000
    });

    await producer.connect();
    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  } finally {
    await admin.disconnect();
  }
}

export { kafka, producer, consumer }; 