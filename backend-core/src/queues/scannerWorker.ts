import { Worker, Job } from 'bullmq';
import { connection } from './scannerQueue.js';
import UserProfile from '../models/UserProfile.js';
import AlarmTimer from '../models/AlarmTimer.js';
import AlertSignal from '../models/AlertSignal.js';
import { fetchCandles, fetchQuote, fetchTopMovers } from '../services/marketData.js';
import { sendSignalEmail, sendMathPassEmail, sendScanSummaryEmail } from '../services/mailer.js';
import { sendPushNotification, sendMathPassNotification } from '../services/onesignal.js';

const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function analyzeWithAI(ticker: string, timeframe: string, candles: any[], toolsConfig: any, quote: any = null, useAI: boolean = true) {
  const payload = { ticker, timeframe, candles, quote, tools: toolsConfig, use_ai: useAI };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${aiServiceUrl}/analyze-ticker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI Service error: ${response.status}`);
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

    if (alarmId) {
      const alarm = await AlarmTimer.findById(alarmId);
      if (!alarm || !alarm.isActive) {
        console.log(`[Worker] Alarm ${alarmId} is inactive or deleted. Skipping.`);
        return;
      }
    }

    const profile = await UserProfile.findOne({ userId });
    if (!profile) { console.log(`[Worker] UserProfile not found for ${userId}.`); return; }
    let tickersToScan = [...(profile.savedTickers || [])];
    
    if (profile.autoScan) {
      const categories: ('stocks' | 'crypto' | 'forex')[] = ['stocks', 'crypto', 'forex'];
      for (const cat of categories) {
        if (profile.autoScan[cat]?.gainers) {
          console.log(`[Worker] Auto-scanning ${cat} top gainers for user ${userId}`);
          const gainers = await fetchTopMovers(cat, 'gainers', 30);
          tickersToScan.push(...gainers);
        }
        if (profile.autoScan[cat]?.losers) {
          console.log(`[Worker] Auto-scanning ${cat} top losers for user ${userId}`);
          const losers = await fetchTopMovers(cat, 'losers', 30);
          tickersToScan.push(...losers);
        }
      }
    }
    
    // Remove duplicates
    tickersToScan = [...new Set(tickersToScan)];

    if (!tickersToScan.length) { console.log(`[Worker] No tickers to scan for ${userId}.`); return; }
    
    const activeStrategies = (profile.strategies || []).filter(s => s.isActive);
    if (!activeStrategies.length) { console.log(`[Worker] No active strategies for ${userId}.`); return; }

    const mathPasses: Array<{ ticker: string, timeframe: string, strategyName: string, indicators: any, broker: string }> = [];
    const aiAlerts: Array<{ ticker: string, timeframe: string, strategyName: string, verdict: string, score: number, rationale: string, indicators: any, broker: string }> = [];

    for (const ticker of tickersToScan) {
      try {
        console.log(`[Worker] Fetching candles for ${ticker} [${profile.preferredTimeframe}]`);
        const candles = await fetchCandles(ticker, profile.preferredTimeframe);
        const quote = await fetchQuote(ticker);

        for (const strategy of activeStrategies) {
          console.log(`[Worker] Calling AI service for ${ticker} using strategy '${strategy.name}' (AI enabled: ${strategy.useAI !== false})`);
          const analysis = await analyzeWithAI(ticker, profile.preferredTimeframe, candles, strategy.indicators, quote, strategy.useAI !== false);

          // ── LEVEL 1: Stock passed the math filter ────────────────────────────
          if (analysis.passed_math_filter) {
            const passedIndicators = Object.entries(analysis.active_indicators || {})
              .filter(([_, d]: any) => d.passed)
              .map(([k]) => k);

            console.log(`[Worker] ${ticker} passed math filter (${passedIndicators.length} indicators). Strategy: ${strategy.name}`);

            // Save Level 1 record
            await new AlertSignal({
              userId: profile.userId,
              ticker,
              timeframe: profile.preferredTimeframe,
              strategyName: strategy.name,
              level: 'math_pass',
              activeIndicators: analysis.active_indicators,
              score: null,
              verdict: null,
              rationale: null,
            }).save();

            // Send Level 1 push notification (We keep individual push notifications, but they might fail if OneSignal key is wrong)
            await sendMathPassNotification(profile.userId, ticker, profile.preferredTimeframe, passedIndicators.length);

            // Queue for batched email
            mathPasses.push({
              ticker,
              timeframe: profile.preferredTimeframe,
              strategyName: strategy.name,
              indicators: analysis.active_indicators,
              broker: profile.preferredBroker,
            });

            // ── LEVEL 2: AI also approved (score >= 80) ──────────────────────
            if (analysis.ai_evaluation) {
              const { score, verdict, rationale } = analysis.ai_evaluation;

              if (score >= 80) {
                console.log(`[Worker] ${ticker} scored ${score}! Saving Level 2 AI alert.`);

                await new AlertSignal({
                  userId: profile.userId,
                  ticker,
                  timeframe: profile.preferredTimeframe,
                  strategyName: strategy.name,
                  level: 'ai_alert',
                  activeIndicators: analysis.active_indicators,
                  score,
                  verdict,
                  rationale,
                }).save();

                // Queue for batched email
                aiAlerts.push({
                    ticker,
                    timeframe: profile.preferredTimeframe,
                    strategyName: strategy.name,
                    verdict,
                    score,
                    rationale,
                    indicators: analysis.active_indicators,
                    broker: profile.preferredBroker,
                });

                await sendPushNotification(profile.userId, ticker, score, profile.preferredTimeframe, profile.preferredBroker);
              } else {
                console.log(`[Worker] ${ticker} passed math but AI scored ${score} (needs 80+). No Level 2 alert.`);
              }
            }
          } else {
            console.log(`[Worker] ${ticker} failed math filter for strategy ${strategy.name}.`);
          }
        }
      } catch (err) {
        console.error(`[Worker] Error analyzing ticker ${ticker}:`, err);
      }
    }
    
    // ── SEND BATCHED EMAILS AT THE END ──────────────────────────────────────────
    if (profile.notificationEmail) {
      if (mathPasses.length > 0) {
          await sendScanSummaryEmail(profile.notificationEmail, mathPasses, aiAlerts);
      }
    }
  },
  { connection, concurrency: 5 }
);

scannerWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});
