import { Queue } from 'bullmq';
import { createConnection } from './connection';

let resumeParseQueue: Queue | null = null;

export const getResumeParseQueue = () => {
  if (!resumeParseQueue) {
    resumeParseQueue = new Queue('resume-parse', {
      connection: createConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 50,
        },
      },
    });
  }
  return resumeParseQueue;
};
