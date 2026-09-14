import type { AlertSignal } from '@/lib/api';

export default function SignalCard({ signal, broker = 'Sahi' }: { signal: AlertSignal, broker?: string }) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-200';
      case 'WATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-bold';
    return 'text-red-500 font-semibold';
  };

  const getBrokerUrl = (b: string, ticker: string) => {
    const l = b.toLowerCase();
    if (l === 'zerodha') return `https://kite.zerodha.com/chart/web/ciq/NSE/${ticker}`;
    if (l === 'upstox') return `https://pro.upstox.com/`;
    if (l === 'groww') return `https://groww.in/stocks`;
    return `https://trade.sahi.com/order?symbol=${ticker}`;
  };

  const triggeredIndicators = Object.entries(signal.activeIndicators || {})
    .filter(([_, data]) => data.passed)
    .map(([key]) => key.toUpperCase());

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{signal.ticker}</h3>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded">
            {signal.timeframe}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getVerdictColor(signal.verdict)}`}>
          {signal.verdict}
        </div>
      </div>
      
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">AI Score:</span>
          <span className={`text-lg ${getScoreColor(signal.score)}`}>{signal.score}/100</span>
        </div>
        {signal.verdict === 'BUY' && (
          <a 
            href={getBrokerUrl(broker, signal.ticker)} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition-colors flex items-center"
          >
            Trade on {broker} <span className="ml-1">↗</span>
          </a>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-1">AI Rationale</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 italic border-l-2 border-blue-400 dark:border-blue-500 pl-3">
          "{signal.rationale}"
        </p>
      </div>

      <div className="mb-4">
        <h4 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-2">Math Filters Passed</h4>
        <div className="flex flex-wrap gap-2">
          {triggeredIndicators.length > 0 ? (
            triggeredIndicators.map(ind => (
              <span key={ind} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 text-xs rounded-md">
                {ind}
              </span>
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
