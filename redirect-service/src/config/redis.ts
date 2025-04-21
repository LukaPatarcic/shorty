import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger';
import { env } from './env';

dotenv.config();

const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

redis.on('error', (error) => {
  logger.error({
    message: 'Redis error',
    error,
    stack: error instanceof Error ? error.stack : undefined
  });
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

export default redis;

// Cache TTL in seconds (7 days)
export const CACHE_TTL = 7 * 24 * 60 * 60;

// Helper functions for URL caching
export async function getCachedURL(code: string): Promise<string | null> {
  return redis.get(`url:${code}`);
}

export async function setCachedURL(code: string, url: string): Promise<void> {
  await redis.set(`url:${code}`, url, 'EX', CACHE_TTL);
}

export async function deleteCachedURL(code: string): Promise<void> {
  await redis.del(`url:${code}`);
} 