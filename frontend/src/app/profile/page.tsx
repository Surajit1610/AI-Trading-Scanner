'use client';

import { useState, useEffect } from 'react';
import { getProfile, updateProfile, getAssets, UserProfileData, Asset } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getAssets().then(setAssets).catch(console.error);
    getProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile) return <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>;

  const filteredAssets = assets.filter(a => 
    a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTicker = (ticker: string) => {
    if (!profile.savedTickers.includes(ticker)) {
      setProfile({ ...profile, savedTickers: [...profile.savedTickers, ticker] });
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const removeTicker = (ticker: string) => {
    setProfile({ ...profile, savedTickers: profile.savedTickers.filter(t => t !== ticker) });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(profile);
      setMessage('Profile saved successfully!');
    } catch (err: any) {
      setMessage('Error saving profile: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* User Info Section */}
      {session?.user && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl uppercase">
              {session.user.name ? session.user.name[0] : session.user.email[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{session.user.name || "User"}</h2>
              <p className="text-gray-500 dark:text-gray-400">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Section */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Global Scan Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md text-sm ${message.includes('Error') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: General & Assets */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">General Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Broker</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={profile.preferredBroker} 
                    onChange={e => setProfile({...profile, preferredBroker: e.target.value})}
                  >
                    <option value="Sahi">Sahi (Default)</option>
                    <option value="Zerodha">Zerodha</option>
                    <option value="Upstox">Upstox</option>
                    <option value="Groww">Groww</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={profile.notificationEmail} 
                    onChange={e => setProfile({...profile, notificationEmail: e.target.value})} 
                    placeholder="alerts@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scan Timeframe</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                    value={profile.preferredTimeframe} 
                    onChange={e => setProfile({...profile, preferredTimeframe: e.target.value})}
                  >
                    <option value="5m">5m</option>
                    <option value="15m">15m</option>
                    <option value="1h">1h</option>
                    <option value="1d">1d</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">My Saved Trades</h3>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search Stocks, Crypto, Forex..." 
                />
                
                {isDropdownOpen && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                      <div 
                        key={asset._id} 
                        className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer flex justify-between items-center"
                        onClick={() => addTicker(asset.ticker)}
                      >
                        <div>
                          <span className="font-bold text-gray-800 dark:text-white">{asset.ticker}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{asset.name}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 uppercase">{asset.category}</span>
                      </div>
                    )) : (
                      <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No assets found</div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.savedTickers.map(ticker => (
                    <span key={ticker} className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800">
                      {ticker}
                      <button type="button" onClick={() => removeTicker(ticker)} className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 focus:outline-none">&times;</button>
                    </span>
                  ))}
                  {profile.savedTickers.length === 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">No trades selected yet.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Indicators */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">My Saved Indicators</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Toggle the math filters the AI should use when scanning your trades.</p>
            
            <div className="space-y-4">
              
              {/* EMA 200 */}
              <div className={`p-4 border rounded-md transition-colors ${profile.savedIndicators.ema200.enabled ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={profile.savedIndicators.ema200.enabled} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, ema200: {...profile.savedIndicators.ema200, enabled: e.target.checked}}})} />
                    <span className="font-medium text-gray-800 dark:text-gray-200">EMA 200 Proximity</span>
                  </label>
                  {profile.savedIndicators.ema200.enabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tolerance %</span>
                      <input type="number" step="0.1" className="w-20 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white" value={profile.savedIndicators.ema200.tolerance_pct} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, ema200: {...profile.savedIndicators.ema200, tolerance_pct: parseFloat(e.target.value)}}})} />
                    </div>
                  )}
                </div>
              </div>

              {/* EMA Cross */}
              <div className={`p-4 border rounded-md transition-colors ${profile.savedIndicators.ema_cross.enabled ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={profile.savedIndicators.ema_cross.enabled} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, ema_cross: {...profile.savedIndicators.ema_cross, enabled: e.target.checked}}})} />
                    <span className="font-medium text-gray-800 dark:text-gray-200">EMA Crossover</span>
                  </label>
                </div>
                {profile.savedIndicators.ema_cross.enabled && (
                  <div className="mt-3 flex items-center space-x-4 pl-8">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fast</span>
                      <input type="number" className="w-16 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white" value={profile.savedIndicators.ema_cross.fast_period} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, ema_cross: {...profile.savedIndicators.ema_cross, fast_period: parseInt(e.target.value)}}})} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Slow</span>
                      <input type="number" className="w-16 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white" value={profile.savedIndicators.ema_cross.slow_period} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, ema_cross: {...profile.savedIndicators.ema_cross, slow_period: parseInt(e.target.value)}}})} />
                    </div>
                  </div>
                )}
              </div>

              {/* Volume Spike */}
              <div className={`p-4 border rounded-md transition-colors ${profile.savedIndicators.volume_spike.enabled ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={profile.savedIndicators.volume_spike.enabled} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, volume_spike: {...profile.savedIndicators.volume_spike, enabled: e.target.checked}}})} />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Volume Surge</span>
                  </label>
                  {profile.savedIndicators.volume_spike.enabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Multiplier</span>
                      <input type="number" step="0.1" className="w-20 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white" value={profile.savedIndicators.volume_spike.multiplier} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, volume_spike: {...profile.savedIndicators.volume_spike, multiplier: parseFloat(e.target.value)}}})} />
                    </div>
                  )}
                </div>
              </div>

              {/* Support / Resistance */}
              <div className={`p-4 border rounded-md transition-colors ${profile.savedIndicators.support_resistance.enabled ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={profile.savedIndicators.support_resistance.enabled} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, support_resistance: {...profile.savedIndicators.support_resistance, enabled: e.target.checked}}})} />
                    <span className="font-medium text-gray-800 dark:text-gray-200">Support / Resistance</span>
                  </label>
                  {profile.savedIndicators.support_resistance.enabled && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lookback Window</span>
                      <input type="number" className="w-20 px-2 py-1 border dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 dark:text-white" value={profile.savedIndicators.support_resistance.window} onChange={e => setProfile({...profile, savedIndicators: {...profile.savedIndicators, support_resistance: {...profile.savedIndicators.support_resistance, window: parseInt(e.target.value)}}})} />
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
