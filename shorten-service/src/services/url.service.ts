import { CreateURL, URL, normalizeURL } from '../models/url';
import { URLDao } from '../models/url.dao';
import { producer } from '../config/kafka';
import { nanoid } from 'nanoid';
import { TOPICS } from '@shorty/shared';
import { log } from 'console';
import logger from '../config/logger';

export class URLService {
  private static readonly CODE_LENGTH = 8;

  static async createShortURL(originalUrl: string): Promise<URL> {
    const normalizedUrl = normalizeURL(originalUrl);
    
    // Check if URL already exists
    const existingUrl = await URLDao.findByNormalizedURL(normalizedUrl);
    if (existingUrl) {
      logger.info({
        message: 'URL already exists',
        existingUrl
      });
      return existingUrl;
    }

    // Create new short URL
    const urlData: CreateURL = {
      original_url: originalUrl,
      normalized_url: normalizedUrl,
      code: nanoid(this.CODE_LENGTH)
    };

    const createdUrl = await URLDao.create(urlData);

    // Emit event to Kafka
    await this.emitURLCreated(createdUrl);

    return createdUrl;
  }

  private static async emitURLCreated(url: URL): Promise<void> {
    const event = {
      type: 'url.created',
      data: {
        originalUrl: url.original_url,
        code: url.code,
        createdAt: url.created_at,
        updatedAt: url.updated_at
      },
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: TOPICS.URL_EVENTS,
      messages: [
        {
          key: url.code,
          value: JSON.stringify(event)
        }
      ]
    });
  }
} 