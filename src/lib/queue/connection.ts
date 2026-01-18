import IORedis from 'ioredis';

export const createConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Enable TLS for secure connections (rediss://)
    tls: redisUrl.startsWith('rediss://') ? {} : undefined,
  });
};
