import type { AlertSignal } from '@/lib/api';

export default function SignalCard({ signal, broker = 'Sahi' }: { signal: AlertSignal, broker?: string }) {
  const isAI = signal.level === 'ai_alert';

  const getVerdictColor = (verdict: string | null) => {
    if (!verdict) return 'bg-blue-100 text-blue-800 border-blue-200'; // Math Pass
    switch (verdict) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'WATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-bold';
    return 'text-red-500 font-semibold';
  };

  const getBrokerUrl = (b: string, ticker: string) => {
    const l = b.toLowerCase();
    let isCrypto = false;
    let isForex = false;
    let symbol = ticker;

    if (ticker.includes('USDT') || ticker.includes('-USD') || ticker.includes('/')) {
        isCrypto = true;
        symbol = symbol.replace('-', '').replace('/', '');
    } else if (ticker.includes('=X')) {
        isForex = true;
        symbol = symbol.replace('=X', '');
    } else {
        symbol = symbol.replace('.NS', '');
    }

    if (l === 'zerodha') return `https://kite.zerodha.com/chart/web/ciq/NSE/${symbol}`;
    if (l === 'upstox') return `https://pro.upstox.com/stocks-trading/${symbol}`;
    if (l === 'groww') return `https://groww.in/stocks/${symbol}`;
    
    // Brokers without public deep-linking (redirect to main terminal)
    if (l === 'shoonya') return `https://shoonya.finvasia.com/#/`;
    if (l === 'angelone') return `https://trade.angelone.in/`;
    if (l === 'dhan') return `https://tv.dhan.co/`;
    if (l === 'fyers') return `https://trade.fyers.in/`;
    if (l === 'sahi') return `https://www.sahi.com/`;

    if (isCrypto) return `https://in.tradingview.com/chart/?symbol=BINANCE:${symbol}`;
    if (isForex) return `https://in.tradingview.com/chart/?symbol=FX_IDC:${symbol}`;
    return `https://in.tradingview.com/chart/?symbol=NSE:${symbol}`;
  };

  const displayBroker = broker || 'TradingView';

  const renderIndicatorDetail = (key: string, data: any) => {
    switch (key) {
      case 'ema200': return `Diff: ${data.diff_pct?.toFixed(2)}% | Val: ${data.value?.toFixed(2)}`;
      case 'volume_spike': return `Vol: ${data.current_volume?.toLocaleString()} (${(data.current_volume / data.sma_20).toFixed(1)}x avg)`;
      case 'stochastic': return `%K: ${data.k_value?.toFixed(1)}`;
      case 'fundamentals': return `Vol: ${data.volume?.toLocaleString()} | MCap: ${(data.marketCap / 10000000).toFixed(1)}Cr`;
      case 'vwap': return `Price is ${data.price_above_vwap ? 'Above' : 'Below'} VWAP`;
      default: return 'Passed';
    }
  };

  const triggeredIndicators = Object.entries(signal.activeIndicators || {})
    .filter(([_, data]) => data.passed);

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow ${isAI ? 'dark:border-gray-700' : 'border-blue-200 dark:border-blue-900/50'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{signal.ticker}</h3>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded">
            {signal.timeframe}
          </span>
          {!isAI && (
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded border border-blue-200 dark:border-blue-800">
              Math Pass
            </span>
          )}
          {signal.strategyName && (
            <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded border border-purple-200 dark:border-purple-800">
              {signal.strategyName}
            </span>
          )}
        </div>
        {isAI && signal.verdict && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(signal.verdict)}`}>
            {signal.verdict}
          </div>
        )}
      </div>
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          {isAI ? (
            <>
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">AI Score:</span>
              <span className={`text-lg ${getScoreColor(signal.score)}`}>{signal.score}/100</span>
            </>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">AI Evaluation in progress...</span>
          )}
        </div>
        
        {(!isAI || signal.verdict === 'BUY') && (
          <a 
            href={getBrokerUrl(broker, signal.ticker)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition-colors flex items-center"
          >
            {displayBroker === 'TradingView' ? 'View on' : 'Trade on'} {displayBroker} <span className="ml-1">↗</span>
          </a>
        )}
      </div>

      {isAI && signal.rationale && (
        <div className="mb-4">
          <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">AI Rationale</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic border-l-2 border-blue-400 dark:border-blue-500 pl-3">
            "{signal.rationale}"
          </p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">Math Filters Passed</h4>
        <div className="flex flex-col space-y-2">
          {triggeredIndicators.length > 0 ? (
            triggeredIndicators.map(([key, data]) => (
              <div key={key} className="flex justify-between items-center px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-100 dark:border-gray-600">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {renderIndicatorDetail(key, data)}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">None</span>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 text-right mt-2">
        {new Date(signal.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
