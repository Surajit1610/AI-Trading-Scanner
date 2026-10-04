'use client';

import { useState, useEffect } from 'react';
import { getProfile, updateProfile, getAssets, searchAssetsAPI, UserProfileData, Asset } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import StrategyEditor, { defaultTools } from './StrategyEditor';

import { sendVerificationEmail } from '@/lib/auth-client';

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    getAssets().then(data => {
      setAssets(data);
      setSearchResults(data);
    }).catch(console.error);
    getProfile().then(p => {
      // Ensure nested objects exist to avoid undefined errors
      if (!p.autoScan) {
        p.autoScan = {
          stocks: { gainers: false, losers: false },
          crypto: { gainers: false, losers: false },
          forex: { gainers: false, losers: false }
        };
      }
      setProfile(p);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults(assets);
      return;
    }
    
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAssetsAPI(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      }
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, assets]);

  const handleVerifyEmail = async () => {
    setSendingVerification(true);
    setVerificationMessage('');
    try {
      const { data, error } = await sendVerificationEmail({
        email: session?.user?.email || '',
        callbackURL: '/profile',
      });
      if (error) {
        setVerificationMessage('Failed to send: ' + error.message);
      } else {
        setVerificationMessage('Verification email sent! Check your inbox.');
      }
    } catch (err: any) {
      setVerificationMessage('Error: ' + err.message);
    }
    setSendingVerification(false);
  };

  const user = session?.user as any;
  if (user && user.accountStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 max-w-lg">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Locked</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your profile settings and trading strategies are locked while your account is pending administrator approval.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="text-gray-500 dark:text-gray-400 text-center py-20 font-medium animate-pulse">Loading profile...</div>;

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
    <div className="space-y-4 sm:space-y-6">
      {/* User Info Section */}
      {session?.user && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg sm:text-xl uppercase shrink-0">
              {session.user.name ? session.user.name[0] : session.user.email[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{session.user.name || "User"}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-full">{session.user.email}</p>
                {session.user.emailVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800 shrink-0">Verified</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium border border-yellow-200 dark:border-yellow-800 shrink-0">Unverified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Banner */}
      {session?.user && !session.user.emailVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Email Not Verified</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Please verify your email address to secure your account and guarantee email alerts.</p>
            {verificationMessage && <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mt-2">{verificationMessage}</p>}
          </div>
          <button
            onClick={handleVerifyEmail}
            disabled={sendingVerification}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {sendingVerification ? 'Sending...' : 'Send Verification Email'}
          </button>
        </div>
      )}

      {/* Main Settings Section */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b dark:border-gray-700">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Global Scan Profile</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md text-sm ${message.includes('Error') ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'}`}>
            {message}
          </div>
        )}

        {/* Top Section: Settings, Trades, Market Movers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* General Settings */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              General Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Broker</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  value={profile.preferredBroker} 
                  onChange={e => setProfile({...profile, preferredBroker: e.target.value})}
                >
                  <option value="TradingView">TradingView (Default)</option>
                  <option value="Zerodha">Zerodha</option>
                  <option value="Upstox">Upstox</option>
                  <option value="Groww">Groww</option>
                  <option value="Shoonya">Shoonya (Finvasia)</option>
                  <option value="AngelOne">Angel One</option>
                  <option value="Dhan">Dhan</option>
                  <option value="Fyers">FYERS</option>
                  <option value="Sahi">Sahi</option>
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
                  <optgroup label="Scalping">
                    <option value="1m">1m — Micro Scalp</option>
                    <option value="2m">2m — Ultra Scalp</option>
                    <option value="5m">5m — Scalping</option>
                  </optgroup>
                  <optgroup label="Intraday">
                    <option value="15m">15m — Intraday Swing</option>
                    <option value="30m">30m — Intraday Swing</option>
                    <option value="1h">1h — Short Swing</option>
                  </optgroup>
                  <optgroup label="Swing Trading">
                    <option value="4h">4h — Multi-Day Swing</option>
                    <option value="1d">1d — Daily Swing</option>
                  </optgroup>
                  <optgroup label="Position / Long-Term">
                    <option value="1wk">1wk — Positional</option>
                    <option value="1mo">1mo — Long-Term</option>
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Saved Trades */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              My Saved Trades
            </h3>
            <div className="relative mb-4">
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
                  {isSearching ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching global markets...</div>
                  ) : searchResults.length > 0 ? searchResults.map(asset => (
                    <div 
                      key={asset._id} 
                      className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer flex justify-between items-center"
                      onClick={() => addTicker(asset.ticker)}
                    >
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white">{asset.ticker}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 block sm:inline">{asset.name}</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 uppercase whitespace-nowrap ml-2">{asset.category}</span>
                    </div>
                  )) : (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No assets found across global markets.</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Scrollable area for saved tickers */}
            <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
              <div className="flex flex-wrap gap-2">
                {profile.savedTickers.map(ticker => (
                  <span key={ticker} className="inline-flex items-center px-3 py-1.5 rounded-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-600 shadow-sm">
                    {ticker}
                    <button type="button" onClick={() => removeTicker(ticker)} className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none transition-colors">&times;</button>
                  </span>
                ))}
                {profile.savedTickers.length === 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">No trades selected yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Auto-Scan Market Movers Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Auto-Scan Movers
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">Automatically append the day's top 30 gainers or losers to your queue during scans.</p>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Indian Stocks */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between p-3 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 xl:mb-0">Stocks (IN)</span>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.stocks?.gainers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, stocks: {...(profile.autoScan?.stocks || { gainers: false, losers: false }), gainers: e.target.checked}}})} />
                    <span className="text-green-600 dark:text-green-400 font-medium">Gainers</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.stocks?.losers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, stocks: {...(profile.autoScan?.stocks || { gainers: false, losers: false }), losers: e.target.checked}}})} />
                    <span className="text-red-600 dark:text-red-400 font-medium">Losers</span>
                  </label>
                </div>
              </div>
              
              {/* Crypto */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between p-3 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 xl:mb-0">Crypto</span>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.crypto?.gainers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, crypto: {...(profile.autoScan?.crypto || { gainers: false, losers: false }), gainers: e.target.checked}}})} />
                    <span className="text-green-600 dark:text-green-400 font-medium">Gainers</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.crypto?.losers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, crypto: {...(profile.autoScan?.crypto || { gainers: false, losers: false }), losers: e.target.checked}}})} />
                    <span className="text-red-600 dark:text-red-400 font-medium">Losers</span>
                  </label>
                </div>
              </div>

              {/* Forex */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between p-3 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 xl:mb-0">Forex</span>
                <div className="flex space-x-3">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.forex?.gainers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, forex: {...(profile.autoScan?.forex || { gainers: false, losers: false }), gainers: e.target.checked}}})} />
                    <span className="text-green-600 dark:text-green-400 font-medium">Gainers</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-blue-600 rounded" checked={profile.autoScan?.forex?.losers || false} onChange={e => setProfile({...profile, autoScan: {...profile.autoScan, forex: {...(profile.autoScan?.forex || { gainers: false, losers: false }), losers: e.target.checked}}})} />
                    <span className="text-red-600 dark:text-red-400 font-medium">Losers</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Strategies */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <svg className="w-6 h-6 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                My Strategies
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure active indicators and AI validation for your scans.</p>
            </div>
            <button 
              onClick={() => {
                const newStrategy = {
                  id: crypto.randomUUID(),
                  name: 'New Strategy',
                  isActive: true,
                  useAI: true,
                  indicators: JSON.parse(JSON.stringify(defaultTools))
                };
                setProfile({ ...profile, strategies: [...(profile.strategies || []), newStrategy] });
              }}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 text-sm font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm border border-blue-200 dark:border-blue-800"
            >
              + Create New Strategy
            </button>
          </div>
          
          <div className="space-y-6">
            {profile.strategies && profile.strategies.length > 0 ? (
              profile.strategies.map((strategy, idx) => (
                <StrategyEditor 
                  key={strategy.id}
                  strategy={strategy}
                  updateStrategy={(updated) => {
                    const newStrats = [...profile.strategies];
                    newStrats[idx] = updated;
                    setProfile({ ...profile, strategies: newStrats });
                  }}
                  deleteStrategy={() => {
                    const newStrats = profile.strategies.filter(s => s.id !== strategy.id);
                    setProfile({ ...profile, strategies: newStrats });
                  }}
                />
              ))
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/30">
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">You don't have any active strategies.</p>
                <button 
                  onClick={() => {
                    const newStrategy = {
                      id: crypto.randomUUID(),
                      name: 'My First Strategy',
                      isActive: true,
                      useAI: true,
                      indicators: JSON.parse(JSON.stringify(defaultTools))
                    };
                    setProfile({ ...profile, strategies: [newStrategy] });
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors"
                >
                  Create a Strategy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
