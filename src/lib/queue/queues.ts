import { Queue } from 'bullmq';
import { createConnection } from './connection';

let resumeParseQueue: Queue | null = null;
let tailorResumeQueue: Queue | null = null;

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

export interface TailorResumeJobData {
  jobId: string;
  userId: string;
  tailoredResumeId: string;
}

export const getTailorResumeQueue = () => {
  if (!tailorResumeQueue) {
    tailorResumeQueue = new Queue<TailorResumeJobData>('tailor-resume', {
      connection: createConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
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
  return tailorResumeQueue;
};
