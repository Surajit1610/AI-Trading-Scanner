const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONE_SIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

async function sendOneSignalPush(userId: string, heading: string, content: string, url: string) {
  if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
    console.warn('[OneSignal] Missing credentials. Skipping push notification.');
    return;
  }

  const payload = {
    app_id: ONE_SIGNAL_APP_ID,
    include_aliases: { external_id: [userId] },
    target_channel: 'push',
    headings: { en: heading },
    contents: { en: content },
    url,
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONE_SIGNAL_API_KEY.replace(/['"]/g, '').trim()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[OneSignal] Failed to send push:', response.status, err);
    } else {
      console.log(`[OneSignal] Push sent to user ${userId}: ${heading}`);
    }
  } catch (error) {
    console.error('[OneSignal] Network error:', error);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/** Level 1 — fires when a stock passes the math filter */
export async function sendMathPassNotification(userId: string, ticker: string, timeframe: string, passedCount: number) {
  await sendOneSignalPush(
    userId,
    `⚡ ${ticker} passed ${passedCount} filter${passedCount !== 1 ? 's' : ''} [${timeframe}]`,
    `${ticker} cleared your math indicators. AI evaluation in progress...`,
    `${FRONTEND_URL}/?tab=math`
  );
}

/** Level 2 — fires when AI confirms a high-scoring setup (score >= 80) */
export async function sendPushNotification(userId: string, ticker: string, score: number, timeframe: string, broker: string) {
  await sendOneSignalPush(
    userId,
    `🟢 AI ALERT: BUY ${ticker}`,
    `Score: ${score}/100 [${timeframe}]. Tap to view rationale and execute on ${broker || 'your broker'}.`,
    `${FRONTEND_URL}/?tab=alerts`
  );
}
