import { Consumer } from 'kafkajs';
import { consumer, producer } from '../config/kafka';
import { setCachedURL } from '../config/redis';
import { Request } from 'express';
import { TOPICS } from '@shorty/shared';
import logger from '../config/logger';

interface URLCreatedEvent {
  type: 'url.created';
  data: {
    code: string;
    originalUrl: string;
  };
  timestamp: string;
}

interface URLClickEvent {
  type: 'url.clicked';
  data: {
    originalUrl: string;
    code: string;
    timestamp: string;
    userAgent?: string;
    ipAddress?: string;
    referer?: string;
  };
}

export class KafkaService {

  private static async handleURLCreated(event: URLCreatedEvent) {
    try {
      const { code, originalUrl } = event.data;
      await setCachedURL(code, originalUrl);
      logger.info({
        message: 'Cached URL for code',
        data: event
      });
    } catch (error) {
      logger.error({
        message: 'Error handling URL created event',
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  static async emitClickEvent(data: { originalUrl: string, code: string }, req: Request) {
    try {
      const payload = {
          originalUrl: data.originalUrl,
          code: data.code,
          timestamp: new Date().toISOString(),
          userAgent: req.headers['user-agent']?.toString(),
          ipAddress: req.ip,
          referer: req.headers['referer']?.toString()
      };

      const event: URLClickEvent = {
        type: 'url.clicked',
        data: payload
      };

      await producer.send({
        topic: TOPICS.URL_EVENTS,
        messages: [{
          value: JSON.stringify(event)
        }]
      });

      logger.info({
        message: `Emitted click event for ${data.originalUrl}`,
        data: payload
      });
    } catch (error) {
      logger.error({
        message: 'Error emitting click event',
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
        topic: TOPICS.URL_EVENTS,
        fromBeginning: true
      });

      consumer.run({
        eachMessage: async ({ message }) => {
          try {
            if (!message.value) return;

            const event = JSON.parse(message.value.toString()) as URLCreatedEvent;
            
            if (event.type === 'url.created') {
              await this.handleURLCreated(event);
            }
          } catch (error) {
            logger.error({
              message: 'Error processing message',
              error,
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        }
      });

      logger.info('Kafka services started');
    } catch (error) {
      logger.error({
        message: 'Error starting Kafka services',
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  static async stopServices() {
    try {
      await Promise.all([
        consumer.disconnect(),
        producer.disconnect()
      ]);
      logger.info('Kafka services stopped');
    } catch (error) {
      logger.error({
        message: 'Error stopping Kafka services',
        error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}