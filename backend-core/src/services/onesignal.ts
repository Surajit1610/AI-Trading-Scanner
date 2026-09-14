const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONE_SIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

export async function sendPushNotification(userId: string, ticker: string, score: number, timeframe: string, broker: string) {
  if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
    console.warn('[OneSignal] Missing credentials. Skipping push notification.');
    return;
  }

  const payload = {
    app_id: ONE_SIGNAL_APP_ID,
    // Target the specific user ID securely linked during login on the frontend
    include_aliases: {
      external_id: [userId]
    },
    target_channel: "push",
    headings: {
      en: `🟢 AI Alert: BUY ${ticker}`
    },
    contents: {
      en: `Score: ${score}/100 [${timeframe}]. Tap to view rationale and execute trade on ${broker || 'Sahi'}.`
    },
    // When the user taps the push notification, route them to their dashboard
    url: process.env.FRONTEND_URL || "http://localhost:3000"
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONE_SIGNAL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[OneSignal] Failed to send push:', response.status, errorData);
    } else {
      console.log(`[OneSignal] Push sent successfully for ${ticker} to user ${userId}`);
    }
  } catch (error) {
    console.error('[OneSignal] Network error:', error);
  }
}
