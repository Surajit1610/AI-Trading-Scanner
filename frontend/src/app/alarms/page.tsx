'use client';

import { useState, useEffect } from 'react';
import { getAlarms, createAlarm, toggleAlarm, deleteAlarm, AlarmTimer } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

export default function AlarmsPage() {
  const { data: session, isPending } = useSession();
  const [alarms, setAlarms] = useState<AlarmTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTime, setNewTime] = useState('09:30');
  const [isAdding, setIsAdding] = useState(false);

  const fetchAlarms = async () => {
    try {
      const data = await getAlarms();
      setAlarms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending && session && (session.user as any).accountStatus !== 'pending') {
      fetchAlarms();
    }
  }, [isPending, session]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await createAlarm(newTime);
      await fetchAlarms();
    } catch (err) {
      console.error(err);
    }
    setIsAdding(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setAlarms(alarms.map(a => a._id === id ? { ...a, isActive: !currentStatus } : a));
    try {
      await toggleAlarm(id, !currentStatus);
    } catch (err) {
      // Revert on error
      console.error(err);
      await fetchAlarms();
    }
  };

  const handleDelete = async (id: string) => {
    setAlarms(alarms.filter(a => a._id !== id));
    try {
      await deleteAlarm(id);
    } catch (err) {
      console.error(err);
      await fetchAlarms();
    }
  };

  if (isPending) return <div className="text-gray-500 text-center py-10">Loading session...</div>;
  if (!session) return null;

  const user = session.user as any;
  if (user.accountStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 max-w-lg">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Alarms Locked</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You cannot set automated trading alarms until your account has been approved by an administrator.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="text-gray-500 dark:text-gray-400 text-center py-20 animate-pulse">Loading alarms...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Scanner Alarms</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Set specific times for the AI to wake up and scan your saved trades using your saved indicators. 
          Just like a phone alarm, you can toggle them on or off anytime.
        </p>

        <form onSubmit={handleAdd} className="flex items-end space-x-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Alarm Time</label>
            <input 
              type="time" 
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding}
            className="px-6 py-2 bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {isAdding ? 'Adding...' : 'Add Alarm'}
          </button>
        </form>

        <div className="space-y-4">
          {alarms.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              No alarms set yet. Add one above!
            </div>
          ) : (
            alarms.map(alarm => (
              <div 
                key={alarm._id} 
                className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
                  alarm.isActive 
                    ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-sm' 
                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-6">
                  <div className={`text-4xl font-light tracking-tight ${alarm.isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                    {alarm.time}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {alarm.isActive ? 'Active' : 'Off'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={alarm.isActive}
                      onChange={() => handleToggle(alarm._id, alarm.isActive)}
                    />
                    <div className="w-14 h-7 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  
                  <button 
                    onClick={() => handleDelete(alarm._id)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete Alarm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
