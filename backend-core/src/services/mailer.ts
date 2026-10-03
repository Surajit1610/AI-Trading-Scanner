import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

interface MailOptions {
  to: string;
  ticker: string;
  timeframe: string;
  strategyName: string;
  verdict: string;
  score: number;
  rationale: string;
  indicators: Record<string, any>;
  broker: string;
}

const getBrokerUrl = (broker: string, ticker: string) => {
  const b = broker?.toLowerCase() || '';
  
  let isCrypto = false;
  let isForex = false;
  let symbol = ticker;

  // Detect Crypto (e.g., ETH/USDT, BTC-USD, ETHUSDT)
  if (ticker.includes('USDT') || ticker.includes('-USD') || ticker.includes('/')) {
      isCrypto = true;
      symbol = symbol.replace('-', '').replace('/', ''); // ETH-USD -> ETHUSD, ETH/USDT -> ETHUSDT
  } 
  // Detect Forex (e.g., USDINR=X, EURUSD=X)
  else if (ticker.includes('=X')) {
      isForex = true;
      symbol = symbol.replace('=X', '');
  } 
  // Default to Indian Stocks
  else {
      symbol = symbol.replace('.NS', '');
  }

  // Indian Brokers (Deep linking where possible)
  if (b === 'groww') return `https://groww.in/stocks/${symbol.toLowerCase()}`;
  
  // Brokers that block unauthenticated deep-linking (redirect to main terminal to prevent 'Key not found' errors)
  if (b === 'zerodha') return `https://kite.zerodha.com/`;
  if (b === 'upstox') return `https://pro.upstox.com/`;
  if (b === 'angelone' || b === 'angel one') return `https://trade.angelone.in/`;
  if (b === 'hdfc' || b === 'hdfc securities') return `https://ntrade.hdfcsec.com/`;
  if (b === 'shoonya') return `https://shoonya.finvasia.com/#/`;
  if (b === 'dhan') return `https://tv.dhan.co/`;
  if (b === 'fyers') return `https://trade.fyers.in/`;
  
  // Default TradingView with correct Exchange prefixes
  if (isCrypto) {
      // e.g. BINANCE:ETHUSDT
      return `https://in.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
  } else if (isForex) {
      // e.g. FX_IDC:USDINR
      return `https://in.tradingview.com/chart/?symbol=FX_IDC:${symbol}`;
  } else {
      // e.g. NSE:TCS
      return `https://in.tradingview.com/chart/?symbol=NSE:${symbol}`;
  }
};

export async function sendSignalEmail({ to, ticker, timeframe, strategyName, verdict, score, rationale, indicators, broker }: MailOptions) {
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
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Strategy: ${strategyName}</p>
      </div>
      
      <div style="padding: 20px;">
        <div style="text-align: center; margin-bottom: 25px;">
            <a href="${brokerUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">
                Execute Trade on ${broker || 'TradingView'}
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
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;"><strong>Strategy:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${strategyName}</td>
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

  const fromAddress = process.env.EMAIL_FROM_ALERTS 
    ? `AI Scanner <${process.env.EMAIL_FROM_ALERTS}>` 
    : 'Scanner <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromAddress, 
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

export async function sendMathPassEmail({ to, ticker, timeframe, strategyName, indicators, broker }: Omit<MailOptions, 'verdict' | 'score' | 'rationale'>) {
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
      <div style="background-color: #8b5cf6; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Math Filter Passed</h2>
        <p style="margin: 5px 0 0 0; font-size: 18px;">${ticker} • ${timeframe}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Strategy: ${strategyName}</p>
      </div>
      
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          <strong>${ticker}</strong> has successfully passed the mathematical filtration for the strategy <strong>${strategyName}</strong>. 
          It is currently being forwarded to the AI Engine for final validation.
        </p>

        <div style="text-align: center; margin-bottom: 25px;">
            <a href="${brokerUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 16px;">
                View Chart on ${broker || 'TradingView'}
            </a>
        </div>

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

  const fromAddress = process.env.EMAIL_FROM_ALERTS 
    ? `AI Scanner <${process.env.EMAIL_FROM_ALERTS}>` 
    : 'Scanner <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromAddress, 
    to: [to],
    subject: `[MATH PASS] ${ticker} triggered ${strategyName}`,
    html: htmlContent,
  });
  
  if (error) {
    console.error(`[Email Error] Failed to send Math Pass email for ${ticker}:`, error);
    throw error;
  }
  
  console.log(`[Email Sent] Math Pass for ${ticker} sent to ${to}. ID: ${data?.id}`);
  return data;
}

export async function sendScanSummaryEmail(
  to: string, 
  mathPasses: Array<{ ticker: string, timeframe: string, strategyName: string, indicators: any, broker: string }>, 
  aiAlerts: Array<{ ticker: string, timeframe: string, strategyName: string, verdict: string, score: number, rationale: string, indicators: any, broker: string }>
) {
  if (!resend) {
    console.warn('[Mailer] RESEND_API_KEY not set. Skipping email dispatch.');
    return;
  }

  const fromAddress = process.env.EMAIL_FROM_ALERTS 
    ? `AI Scanner <${process.env.EMAIL_FROM_ALERTS}>` 
    : 'Scanner <onboarding@resend.dev>';

  let aiAlertsHtml = '';
  if (aiAlerts.length > 0) {
    aiAlertsHtml = `
      <div style="margin-bottom: 30px;">
        <h3 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 5px;">🔥 AI Verified Signals (${aiAlerts.length})</h3>
        ${aiAlerts.map(alert => `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="margin: 0; font-size: 18px; color: #166534;">${alert.ticker} • Score: ${alert.score}</h4>
              <span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${alert.verdict}</span>
            </div>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #374151;"><strong>Strategy:</strong> ${alert.strategyName} | <strong>Timeframe:</strong> ${alert.timeframe}</p>
            <p style="margin: 0 0 15px 0; font-size: 13px; font-style: italic; color: #4b5563;">"${alert.rationale}"</p>
            <a href="${getBrokerUrl(alert.broker, alert.ticker)}" style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px;">Execute on ${alert.broker || 'Broker'}</a>
          </div>
        `).join('')}
      </div>
    `;
  }

  const mathPassesHtml = `
    <div>
      <h3 style="color: #8b5cf6; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px;">⚡ Math Filter Passes (${mathPasses.length})</h3>
      <p style="font-size: 13px; color: #6b7280; margin-top: 0; margin-bottom: 15px;">These stocks passed your mathematical indicators.</p>
      
      <div style="display: block;">
        ${mathPasses.map(p => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
            <div style="display: block; margin-bottom: 8px;">
              <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #1e293b;">${p.ticker} <span style="font-size: 13px; color: #64748b; font-weight: normal;">(${p.timeframe})</span></h4>
              <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Strategy:</strong> ${p.strategyName}</p>
            </div>
            <div style="margin-top: 10px;">
              <a href="${getBrokerUrl(p.broker, p.ticker)}" style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 4px; text-align: center;">Execute Trade</a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Scan Complete</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Found ${mathPasses.length} matches and ${aiAlerts.length} verified signals.</p>
      </div>
      
      <div style="padding: 20px;">
        ${aiAlertsHtml}
        ${mathPassesHtml}
      </div>
      
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        Automated AI Market Scanner &copy; ${new Date().getFullYear()}
      </div>
    </div>
  `;

  const subject = aiAlerts.length > 0 
    ? `[AI ALERT] ${aiAlerts.length} high-probability setups found!` 
    : `[SCANNER] ${mathPasses.length} stocks passed math filter`;

  const { data, error } = await resend.emails.send({
    from: fromAddress, 
    to: [to],
    subject,
    html: htmlContent,
  });
  
  if (error) {
    console.error(`[Email Error] Failed to send scan summary to ${to}:`, error);
    throw error;
  }
  
  console.log(`[Email Sent] Scan summary sent to ${to}. ID: ${data?.id}`);
  return data;
}
