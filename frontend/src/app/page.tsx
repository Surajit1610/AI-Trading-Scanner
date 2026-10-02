'use client';

import { useState, useEffect } from 'react';
import SignalList from '@/components/SignalList';
import { triggerImmediateScan, getProfile } from '@/lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [broker, setBroker] = useState('Sahi');

  const [activeTab, setActiveTab] = useState<'ai_alert' | 'math_pass'>('ai_alert');

  useEffect(() => {
    getProfile().then(p => setBroker(p.preferredBroker)).catch(console.error);
    
    // Allow URL param to set initial tab
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'math') setActiveTab('math_pass');
    }
  }, []);

  const handleTestScan = async () => {
    setLoading(true);
    setMessage('');
    try {
      await triggerImmediateScan();
      setMessage('Scan triggered successfully! Wait a few seconds for evaluation.');
    } catch (err: any) {
      setMessage('Error triggering scan: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your recent AI trading alerts and signals.</p>
        </div>
        <button
          onClick={handleTestScan}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Triggering...' : 'Force Global Scan Now'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm ${message.includes('Error') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex space-x-6 border-b dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('ai_alert')}
            className={`pb-4 text-sm font-semibold transition-colors ${
              activeTab === 'ai_alert'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            AI Alerts (Score &ge; 80)
          </button>
          <button
            onClick={() => setActiveTab('math_pass')}
            className={`pb-4 text-sm font-semibold transition-colors ${
              activeTab === 'math_pass'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Math Passes (Last 24h)
          </button>
        </div>
        
        <SignalList broker={broker} level={activeTab} />
      </div>
    </div>
  );
}
