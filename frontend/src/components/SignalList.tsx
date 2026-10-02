'use client';

import { useEffect, useState } from 'react';
import { getSignals } from '@/lib/api';
import type { AlertSignal } from '@/lib/api';
import SignalCard from './SignalCard';

export default function SignalList({ broker = 'Sahi', level }: { broker?: string, level?: 'math_pass' | 'ai_alert' }) {
  const [signals, setSignals] = useState<AlertSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const data = await getSignals(level);
      setSignals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [level]);

  const exportToCsv = () => {
    if (signals.length === 0) return;
    
    // Create CSV headers
    const headers = ['Date', 'Ticker', 'Timeframe', 'Verdict', 'Score', 'Rationale'];
    
    // Map data
    const csvRows = signals.map(s => {
      const safeRationale = s.rationale ? s.rationale.replace(/"/g, '""') : '';
      return [
        new Date(s.createdAt).toISOString(),
        s.ticker,
        s.timeframe,
        s.verdict || 'MATH_PASS',
        s.score !== null ? s.score : 'N/A',
        `"${safeRationale}"` // Escape quotes for CSV
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trading_signals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading signals...</div>;
  }

  if (signals.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-8 text-center text-gray-500">
        No signals generated yet. Waiting for market action...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={exportToCsv}
          className="px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded hover:bg-gray-700 transition-colors"
        >
          Export CSV ⬇
        </button>
      </div>
      <div className="space-y-4">
        {signals.map(signal => (
          <SignalCard key={signal._id} signal={signal} broker={broker} />
        ))}
      </div>
    </div>
  );
}
