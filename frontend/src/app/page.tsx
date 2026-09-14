'use client';

import { useState, useEffect } from 'react';
import SignalList from '@/components/SignalList';
import { triggerImmediateScan, getProfile } from '@/lib/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [broker, setBroker] = useState('Sahi');

  useEffect(() => {
    getProfile().then(p => setBroker(p.preferredBroker)).catch(console.error);
  }, []);

  const handleTestScan = async () => {
    setLoading(true);
    setMessage('');
    try {
      await triggerImmediateScan();
      setMessage('Scan triggered successfully! Wait a few seconds for AI evaluation.');
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
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-4 mb-4">Recent Alerts</h2>
        <SignalList broker={broker} />
      </div>
    </div>
  );
}
