import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

interface MailOptions {
  to: string;
  ticker: string;
  timeframe: string;
  verdict: string;
  score: number;
  rationale: string;
  indicators: Record<string, any>;
  broker: string;
}

const getBrokerUrl = (broker: string, ticker: string) => {
  const b = broker.toLowerCase();
  if (b === 'zerodha') return `https://kite.zerodha.com/chart/web/ciq/NSE/${ticker}`;
  if (b === 'upstox') return `https://pro.upstox.com/`;
  if (b === 'groww') return `https://groww.in/stocks`;
  return `https://trade.sahi.com/order?symbol=${ticker}`; // Default/Sahi
};

export async function sendSignalEmail({ to, ticker, timeframe, verdict, score, rationale, indicators, broker }: MailOptions) {
  if (!resend) {
    console.warn('[Mailer] RESEND_API_KEY not set. Skipping email dispatch.');
    return;
  }

  const brokerUrl = getBrokerUrl(broker, ticker);
  
  const indicatorsHtml = Object.entries(indicators).map(([key, val]) => {
    return `<li><strong>${key.toUpperCase()}:</strong> ${JSON.stringify(val)}</li>`;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${verdict === 'BUY' ? '#10b981' : '#3b82f6'}; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">AI Trading Alert</h2>
        <p style="margin: 5px 0 0 0; font-size: 18px;">${ticker} • ${timeframe}</p>
      </div>
      
      <div style="padding: 20px;">
        <div style="text-align: center; margin-bottom: 25px;">
            <a href="${brokerUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">
                Execute Trade on ${broker || 'Sahi'}
            </a>
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Zero delay. Click to open your broker directly.</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Verdict:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea; font-weight: bold; color: ${verdict === 'BUY' ? '#10b981' : '#f59e0b'};">${verdict}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>AI Score:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea; font-weight: bold;">${score} / 100</td>
          </tr>
        </table>

        <h3>Rationale</h3>
        <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; font-style: italic; line-height: 1.5;">
          ${rationale}
        </p>

        <h3>Active Indicators Triggered</h3>
        <ul>
          ${indicatorsHtml || '<li>No specific indicator details provided</li>'}
        </ul>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
        Automated AI Market Scanner &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: 'Scanner <alerts@resend.dev>', // Use a verified domain in production
    to: [to],
    subject: `[${verdict}] ${ticker} AI Trading Alert - Score ${score}`,
    html: htmlContent,
  });
  
  if (error) {
    console.error(`[Email Error] Failed to send email for ${ticker}:`, error);
    throw error;
  }
  
  console.log(`[Email Sent] Signal for ${ticker} sent to ${to}. ID: ${data?.id}`);
  return data;
}
