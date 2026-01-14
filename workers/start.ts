import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Resume Parse Worker
const resumeParseWorker = new Worker(
  'resume-parse',
  async (job) => {
    const { resumeId, userId } = job.data;
    console.log(`Processing resume: ${resumeId} for user: ${userId}`);

    // Worker logic here - can call the same parsing logic
    // This allows background processing for large files

    return { success: true, resumeId };
  },
  {
    connection,
    concurrency: 5,
  }
);

resumeParseWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

resumeParseWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Workers started and listening for jobs...');
