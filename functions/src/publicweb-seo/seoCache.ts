import type { SeoData } from './types';

type CacheEntry = { value: SeoData; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_SECONDS = 6 * 60 * 60;

let redisClient: any | null = null;
let redisReady = false;

const getRedisClient = async () => {
  if (redisReady && redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  if (!redisUrl && !redisHost) return null;

  if (!redisClient) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redis = require('redis');
    redisClient = redis.createClient({
      url: redisUrl,
      socket: redisHost
        ? {
            host: redisHost,
            port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
          }
        : undefined,
      password: process.env.REDIS_PASSWORD,
    });
    redisClient.on('error', (error: any) => {
      console.warn('Redis error:', error?.message || error);
    });
  }

  if (redisClient && !redisReady) {
    try {
      await redisClient.connect();
      redisReady = true;
    } catch (error) {
      console.warn('Redis connection failed:', error);
      redisReady = false;
      return null;
    }
  }

  return redisReady ? redisClient : null;
};

export const getSeoCache = async (key: string): Promise<SeoData | null> => {
  const redis = await getRedisClient();
  if (redis) {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as SeoData;
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setSeoCache = async (key: string, value: SeoData, ttlSeconds: number = DEFAULT_TTL_SECONDS) => {
  const redis = await getRedisClient();
  if (redis) {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return;
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

