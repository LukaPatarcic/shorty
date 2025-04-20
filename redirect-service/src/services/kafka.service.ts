import { Consumer } from 'kafkajs';
import { consumer } from '../config/kafka';
import { setCachedURL } from '../config/redis';

interface URLCreatedEvent {
  type: 'url.created';
  data: {
    code: string;
    original_url: string;
  };
  timestamp: string;
}

export class KafkaService {
  private static readonly TOPICS = {
    URL_EVENTS: 'url.events'
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

  static async startConsumer() {
    try {
      await consumer.connect();
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

      console.log('Kafka consumer started');
    } catch (error) {
      console.error('Error starting Kafka consumer:', error);
      throw error;
    }
  }

  static async stopConsumer() {
    try {
      await consumer.disconnect();
      console.log('Kafka consumer stopped');
    } catch (error) {
      console.error('Error stopping Kafka consumer:', error);
    }
  }
} 