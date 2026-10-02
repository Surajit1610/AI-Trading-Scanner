import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const connection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

export const scannerQueue = new Queue('market-scanner-queue', { connection });

export async function addAlarmJob(alarmId: string, userId: string, cron: string) {
  await scannerQueue.upsertJobScheduler(
    `alarm-${alarmId}`,
    { pattern: cron, tz: 'Asia/Kolkata' },
    {
      name: 'scan-alarm',
      data: { alarmId, userId },
    }
  );
  console.log(`[Queue] Added repeatable job for alarm ${alarmId} with cron: ${cron}`);
}

export async function removeAlarmJob(alarmId: string) {
  await scannerQueue.removeJobScheduler(`alarm-${alarmId}`);
  console.log(`[Queue] Removed repeatable job for alarm ${alarmId}`);
}

export async function addImmediateJob(userId: string) {
  await scannerQueue.add('scan-immediate', { userId });
  console.log(`[Queue] Added immediate job for user ${userId}`);
}
