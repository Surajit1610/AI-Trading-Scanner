import { useState } from 'react';
import { Strategy, ToolsConfig } from '@/lib/api';

export const defaultTools: ToolsConfig = {
  ema200: { enabled: false, tolerance_pct: 0.5 },
  ema_cross: { enabled: false, fast_period: 20, slow_period: 50 },
  volume_spike: { enabled: false, multiplier: 1.5 },
  support_resistance: { enabled: false, window: 20 },
  fundamentals: { enabled: false, min_volume: 1000000, min_market_cap: 50000000000, min_change_pct: 0.5, max_change_pct: 2.5 },
  stochastic: { enabled: false, oversold_threshold: 20 },
  williams_r: { enabled: false, oversold_threshold: -80 },
  bollinger_bands: { enabled: false, tolerance_pct: 1.5 },
  vwap: { enabled: false, require_above: true },
  macd: { enabled: false, require_positive_hist: true, fast: 12, slow: 26, signal: 9 },
  ichimoku: { enabled: false, condition: 'above_cloud' },
  rsi: { enabled: false, period: 14, condition: 'oversold', threshold: 30 },
  open_interest: { enabled: false, condition: 'highest' },
};

export default function StrategyEditor({ strategy, updateStrategy, deleteStrategy }: { strategy: Strategy, updateStrategy: (s: Strategy) => void, deleteStrategy: () => void }) {
  const t = strategy.indicators || defaultTools;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const updateTool = (toolName: keyof ToolsConfig, field: string, value: any) => {
    updateStrategy({
      ...strategy,
      indicators: {
        ...t,
        [toolName]: { ...t[toolName], [field]: value }
      }
    });
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="bg-gray-50 dark:bg-gray-800/80 p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            className="form-checkbox h-5 w-5 text-blue-600 rounded cursor-pointer shrink-0" 
            checked={strategy.isActive} 
            onChange={e => updateStrategy({...strategy, isActive: e.target.checked})} 
            title="Enable/Disable this strategy in scans"
          />
          <input 
            type="text" 
            className="font-bold text-lg bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none text-gray-900 dark:text-white w-full md:w-64" 
            value={strategy.name} 
            onChange={e => updateStrategy({...strategy, name: e.target.value})} 
            placeholder="Strategy Name"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto md:justify-end">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full border border-purple-100 dark:border-purple-800/30" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold text-purple-700 dark:text-purple-400">AI Validation</span>
            <input 
              type="checkbox" 
              className="form-checkbox h-4 w-4 text-purple-600 rounded cursor-pointer"
              checked={strategy.useAI !== false} 
              onChange={e => updateStrategy({...strategy, useAI: e.target.checked})} 
            />
          </label>
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center shrink-0">
            {isExpanded ? (
              <><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg> Hide Config</>
            ) : (
              <><svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> Show Config</>
            )}
          </span>
          <button onClick={(e) => { e.stopPropagation(); deleteStrategy(); }} className="text-red-500 hover:text-red-700 text-sm font-medium focus:outline-none shrink-0 p-1">
            Delete
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-5 bg-white dark:bg-gray-800">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Technical Indicators</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select the mathematical rules required for this strategy to pass. A stock must pass ALL enabled filters here to trigger an alert.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* EMA 200 */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.ema200?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.ema200?.enabled} onChange={e => updateTool('ema200', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">EMA 200 Proximity</span>
                </label>
                {t.ema200?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">± %</span>
                    <input type="number" step="0.1" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white focus:ring-1 focus:ring-blue-500 outline-none" value={t.ema200.tolerance_pct} onChange={e => updateTool('ema200', 'tolerance_pct', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* EMA Cross */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.ema_cross?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.ema_cross?.enabled} onChange={e => updateTool('ema_cross', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">EMA Crossover</span>
                </label>
                {t.ema_cross?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">F/S</span>
                    <input type="number" className="w-14 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.ema_cross.fast_period} onChange={e => updateTool('ema_cross', 'fast_period', parseInt(e.target.value))} />
                    <input type="number" className="w-14 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.ema_cross.slow_period} onChange={e => updateTool('ema_cross', 'slow_period', parseInt(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* Volume Spike */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.volume_spike?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.volume_spike?.enabled} onChange={e => updateTool('volume_spike', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Volume Surge</span>
                </label>
                {t.volume_spike?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Mult</span>
                    <input type="number" step="0.1" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.volume_spike.multiplier} onChange={e => updateTool('volume_spike', 'multiplier', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>
            
            {/* RSI */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.rsi?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.rsi?.enabled} onChange={e => updateTool('rsi', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">RSI</span>
                </label>
                {t.rsi?.enabled && (
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:pl-7">
                    <input type="number" className="w-14 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.rsi.period} onChange={e => updateTool('rsi', 'period', parseInt(e.target.value))} />
                    <select className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none flex-1 min-w-[100px]" value={t.rsi.condition} onChange={e => updateTool('rsi', 'condition', e.target.value)}>
                      <option value="oversold">Oversold (≤)</option>
                      <option value="overbought">Overbought (≥)</option>
                    </select>
                    <input type="number" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.rsi.threshold} onChange={e => updateTool('rsi', 'threshold', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* MACD */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.macd?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.macd?.enabled} onChange={e => updateTool('macd', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">MACD</span>
                </label>
                {t.macd?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <label className="flex items-center space-x-2 cursor-pointer bg-white dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600">
                      <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600" checked={t.macd.require_positive_hist} onChange={e => updateTool('macd', 'require_positive_hist', e.target.checked)} />
                      <span className="text-gray-700 dark:text-gray-300">Hist &gt; 0</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Ichimoku */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.ichimoku?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.ichimoku?.enabled} onChange={e => updateTool('ichimoku', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Ichimoku Cloud</span>
                </label>
                {t.ichimoku?.enabled && (
                  <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
                    <select className="w-full sm:w-auto px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.ichimoku.condition} onChange={e => updateTool('ichimoku', 'condition', e.target.value)}>
                      <option value="above_cloud">Above Cloud</option>
                      <option value="below_cloud">Below Cloud</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Support / Resistance */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.support_resistance?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.support_resistance?.enabled} onChange={e => updateTool('support_resistance', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Support / Resist</span>
                </label>
                {t.support_resistance?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Lookback</span>
                    <input type="number" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.support_resistance.window} onChange={e => updateTool('support_resistance', 'window', parseInt(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* Stochastic */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.stochastic?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.stochastic?.enabled} onChange={e => updateTool('stochastic', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Stochastic</span>
                </label>
                {t.stochastic?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Oversold ≤</span>
                    <input type="number" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.stochastic.oversold_threshold} onChange={e => updateTool('stochastic', 'oversold_threshold', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* Williams %R */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.williams_r?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.williams_r?.enabled} onChange={e => updateTool('williams_r', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Williams %R</span>
                </label>
                {t.williams_r?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Oversold ≤</span>
                    <input type="number" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.williams_r.oversold_threshold} onChange={e => updateTool('williams_r', 'oversold_threshold', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* Bollinger Bands */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.bollinger_bands?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.bollinger_bands?.enabled} onChange={e => updateTool('bollinger_bands', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Bollinger Bands</span>
                </label>
                {t.bollinger_bands?.enabled && (
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Tol %</span>
                    <input type="number" step="0.1" className="w-16 px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.bollinger_bands.tolerance_pct} onChange={e => updateTool('bollinger_bands', 'tolerance_pct', parseFloat(e.target.value))} />
                  </div>
                )}
              </div>
            </div>

            {/* VWAP */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.vwap?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.vwap?.enabled} onChange={e => updateTool('vwap', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">VWAP</span>
                </label>
                {t.vwap?.enabled && (
                  <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
                    <select className="w-full sm:w-auto px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.vwap.require_above ? 'above' : 'below'} onChange={e => updateTool('vwap', 'require_above', e.target.value === 'above')}>
                      <option value="above">Above VWAP</option>
                      <option value="below">Below VWAP</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Open Interest */}
            <div className={`flex flex-col justify-center p-3 border rounded-lg transition-colors ${t.open_interest?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                  <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.open_interest?.enabled} onChange={e => updateTool('open_interest', 'enabled', e.target.checked)} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Open Interest</span>
                </label>
                {t.open_interest?.enabled && (
                  <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
                    <select className="w-full sm:w-auto px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.open_interest.condition} onChange={e => updateTool('open_interest', 'condition', e.target.value)}>
                      <option value="highest">Highest</option>
                      <option value="highest_change">High Change</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fundamentals */}
            <div className={`col-span-1 md:col-span-2 xl:col-span-3 flex flex-col p-3 border rounded-lg transition-colors ${t.fundamentals?.enabled ? 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
              <label className="flex items-center space-x-3 cursor-pointer mb-3">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" checked={t.fundamentals?.enabled} onChange={e => updateTool('fundamentals', 'enabled', e.target.checked)} />
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Fundamental Constraints</span>
              </label>
              {t.fundamentals?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:pl-7">
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-500 font-medium">Min Volume</span>
                    <input type="number" className="px-2 py-1.5 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.fundamentals.min_volume} onChange={e => updateTool('fundamentals', 'min_volume', parseInt(e.target.value))} />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-gray-500 font-medium">Min Market Cap</span>
                    <input type="number" className="px-2 py-1.5 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-black dark:text-white outline-none" value={t.fundamentals.min_market_cap} onChange={e => updateTool('fundamentals', 'min_market_cap', parseInt(e.target.value))} />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
