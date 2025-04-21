import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';

export const TOPICS = {
  URL_EVENTS: 'url.events',
  URL_CLICKS: 'url.clicks'
} as const;

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId?: string;
}

export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });
  }

  async createProducer(): Promise<Producer> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner
      });
      await this.producer.connect();
    }
    return this.producer;
  }

  async createConsumer(groupId: string): Promise<Consumer> {
    if (!this.consumer) {
      this.consumer = this.kafka.consumer({ groupId });
      await this.consumer.connect();
    }
    return this.consumer;
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.producer?.disconnect(),
      this.consumer?.disconnect()
    ]);
  }

  static async createTopics(kafka: Kafka, topics: string[]): Promise<void> {
    const admin = kafka.admin();
    try {
      await admin.connect();
      await admin.createTopics({
        topics: topics.map(topic => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
          configEntries: [
            { name: 'retention.ms', value: '604800000' } // 7 days retention
          ]
        })),
        waitForLeaders: true,
        timeout: 10000
      });
    } finally {
      await admin.disconnect();
    }
  }
} 