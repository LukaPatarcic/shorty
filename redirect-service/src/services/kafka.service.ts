import { Consumer } from 'kafkajs';
import { consumer, producer } from '../config/kafka';
import { setCachedURL } from '../config/redis';
import { Request } from 'express';

interface URLCreatedEvent {
  type: 'url.created';
  data: {
    code: string;
    original_url: string;
  };
  timestamp: string;
}

interface URLClickEvent {
  type: 'url.clicked';
  data: {
    shortUrl: string;
    timestamp: string;
    userAgent?: string;
    ipAddress?: string;
    referer?: string;
  };
}

export class KafkaService {
  private static readonly TOPICS = {
    URL_EVENTS: 'url.events',
    URL_CLICKS: 'url.clicks'
  };

  private static async handleURLCreated(event: URLCreatedEvent) {
    try {
      const { code, original_url } = event.data;
      await setCachedURL(code, original_url);
      console.log(`Cached URL for code: ${code}`);
    } catch (error) {
      console.error('Error handling URL created event:', error);
    }
  }

  static async emitClickEvent(shortUrl: string, req: Request) {
    try {
      const event: URLClickEvent = {
        type: 'url.clicked',
        data: {
          shortUrl,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent']?.toString(),
          ipAddress: req.ip,
          referer: req.headers['referer']?.toString()
        }
      };

      await producer.send({
        topic: this.TOPICS.URL_CLICKS,
        messages: [{
          value: JSON.stringify(event)
        }]
      });

      console.log(`Emitted click event for: ${shortUrl}`);
    } catch (error) {
      console.error('Error emitting click event:', error);
    }
  }

  static async startServices() {
    try {
      // Connect both consumer and producer
      await Promise.all([
        consumer.connect(),
        producer.connect()
      ]);

      await consumer.subscribe({
        topic: this.TOPICS.URL_EVENTS,
        fromBeginning: true
      });

      await consumer.run({
        eachMessage: async ({ message }) => {
          try {
            if (!message.value) return;

            const event = JSON.parse(message.value.toString()) as URLCreatedEvent;
            
            if (event.type === 'url.created') {
              await this.handleURLCreated(event);
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      });

      console.log('Kafka services started');
    } catch (error) {
      console.error('Error starting Kafka services:', error);
      throw error;
    }
  }

  static async stopServices() {
    try {
      await Promise.all([
        consumer.disconnect(),
        producer.disconnect()
      ]);
      console.log('Kafka services stopped');
    } catch (error) {
      console.error('Error stopping Kafka services:', error);
    }
  }
} 