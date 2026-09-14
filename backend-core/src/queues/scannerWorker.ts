import { Worker, Job } from 'bullmq';
import { connection } from './scannerQueue.js';
import UserProfile from '../models/UserProfile.js';
import AlarmTimer from '../models/AlarmTimer.js';
import AlertSignal from '../models/AlertSignal.js';
import { fetchCandles } from '../services/marketData.js';
import { sendSignalEmail } from '../services/mailer.js';
import { sendPushNotification } from '../services/onesignal.js';

const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function analyzeWithAI(ticker: string, timeframe: string, candles: any[], toolsConfig: any) {
  const payload = {
    ticker,
    timeframe,
    candles,
    tools: toolsConfig,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`${aiServiceUrl}/analyze-ticker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI Service HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const scannerWorker = new Worker(
  'market-scanner-queue',
  async (job: Job) => {
    const { userId, alarmId } = job.data;
    console.log(`[Worker] Processing job for user: ${userId}`);

    // If it's a scheduled alarm job, verify the alarm is still active
    if (alarmId) {
      const alarm = await AlarmTimer.findById(alarmId);
      if (!alarm || !alarm.isActive) {
        console.log(`[Worker] Alarm ${alarmId} is inactive or deleted. Skipping.`);
        return;
      }
    }

    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      console.log(`[Worker] UserProfile not found for user ${userId}.`);
      return;
    }

    if (!profile.savedTickers || profile.savedTickers.length === 0) {
      console.log(`[Worker] No saved tickers for user ${userId}.`);
      return;
    }

    for (const ticker of profile.savedTickers) {
      try {
        console.log(`[Worker] Fetching candles for ${ticker} [${profile.preferredTimeframe}]`);
        const candles = await fetchCandles(ticker, profile.preferredTimeframe);

        console.log(`[Worker] Calling AI service for ${ticker}`);
        const analysis = await analyzeWithAI(ticker, profile.preferredTimeframe, candles, profile.savedIndicators);

        if (analysis.passed_math_filter && analysis.ai_evaluation) {
          const { score, verdict, rationale } = analysis.ai_evaluation;

          if (score >= 80) {
            console.log(`[Worker] ${ticker} scored ${score}! Saving signal & sending alerts...`);

            // Save to DB
            const signal = new AlertSignal({
              userId: profile.userId,
              ticker,
              timeframe: profile.preferredTimeframe,
              score,
              verdict,
              rationale,
              activeIndicators: analysis.active_indicators,
            });
            await signal.save();

            // Send Email (if configured)
            if (profile.notificationEmail) {
              await sendSignalEmail({
                to: profile.notificationEmail,
                ticker,
                timeframe: profile.preferredTimeframe,
                verdict,
                score,
                rationale,
                indicators: analysis.active_indicators,
                broker: profile.preferredBroker // pass broker for email template link
              });
            }

            // Send Push Notification
            await sendPushNotification(profile.userId, ticker, score, profile.preferredTimeframe, profile.preferredBroker);
          } else {
            console.log(`[Worker] ${ticker} passed math but score was ${score} (needs 80+)`);
          }
        } else {
          console.log(`[Worker] ${ticker} failed math filter.`);
        }
      } catch (err) {
        console.error(`[Worker] Error analyzing ticker ${ticker}:`, err);
      }
    }
  },
  { connection, concurrency: 5 }
);

scannerWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
