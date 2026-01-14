import IORedis from 'ioredis';

const getRedisConfig = () => {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
};

export const createConnection = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  return new IORedis(redisUrl, getRedisConfig());
};
