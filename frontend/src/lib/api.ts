export const API_URL = '';

export interface ToolsConfig {
  ema200: { enabled: boolean; tolerance_pct: number };
  ema_cross: { enabled: boolean; fast_period: number; slow_period: number };
  volume_spike: { enabled: boolean; multiplier: number };
  support_resistance: { enabled: boolean; window: number };
  fundamentals: { enabled: boolean; min_volume: number; min_market_cap: number; min_change_pct: number; max_change_pct: number };
  stochastic: { enabled: boolean; oversold_threshold: number };
  williams_r: { enabled: boolean; oversold_threshold: number };
  bollinger_bands: { enabled: boolean; tolerance_pct: number };
  vwap: { enabled: boolean; require_above: boolean };
  macd: { enabled: boolean; require_positive_hist: boolean; fast: number; slow: number; signal: number };
  ichimoku: { enabled: boolean; condition: 'above_cloud' | 'below_cloud' };
  rsi: { enabled: boolean; period: number; condition: 'oversold' | 'overbought'; threshold: number };
  open_interest: { enabled: boolean; condition: 'highest' | 'highest_change' };
}

export interface Strategy {
  id: string;
  name: string;
  isActive: boolean;
  useAI: boolean;
  indicators: ToolsConfig;
}

export interface UserProfileData {
  userId?: string;
  savedTickers: string[];
  strategies: Strategy[];
  autoScan: {
    stocks: { gainers: boolean; losers: boolean };
    crypto: { gainers: boolean; losers: boolean };
    forex: { gainers: boolean; losers: boolean };
  };
  preferredTimeframe: string;
  preferredBroker: string;
  notificationEmail: string;
}

export interface AlarmTimer {
  _id: string;
  userId: string;
  time: string;
  isActive: boolean;
}

export interface Asset {
  _id: string;
  ticker: string;
  name: string;
  category: 'crypto' | 'forex' | 'stock' | 'index';
  exchange?: string;
}

export interface AlertSignal {
  _id: string;
  userId: string;
  ticker: string;
  timeframe: string;
  strategyName?: string;
  level: 'math_pass' | 'ai_alert';
  score: number | null;
  verdict: string | null;
  rationale: string | null;
  activeIndicators: Record<string, any>;
  createdAt: string;
}

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_URL}/api/v1/assets`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function searchAssetsAPI(query: string): Promise<Asset[]> {
  if (!query) return [];
  const res = await fetch(`${API_URL}/api/v1/assets/search?q=${encodeURIComponent(query)}`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to search live assets');
  return res.json();
}

export async function getProfile(): Promise<UserProfileData> {
  const res = await fetch(`${API_URL}/api/v1/profile`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: Partial<UserProfileData>): Promise<UserProfileData> {
  const res = await fetch(`${API_URL}/api/v1/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function triggerImmediateScan(): Promise<any> {
  const res = await fetch(`${API_URL}/api/v1/scan/trigger`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to trigger scan');
  return res.json();
}

export async function getAlarms(): Promise<AlarmTimer[]> {
  const res = await fetch(`${API_URL}/api/v1/alarms`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch alarms');
  return res.json();
}

export async function createAlarm(time: string): Promise<AlarmTimer> {
  const res = await fetch(`${API_URL}/api/v1/alarms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to create alarm');
  return res.json();
}

export async function toggleAlarm(id: string, isActive: boolean): Promise<AlarmTimer> {
  const res = await fetch(`${API_URL}/api/v1/alarms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to toggle alarm');
  return res.json();
}

export async function deleteAlarm(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/alarms/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete alarm');
}

export async function getSignals(level?: 'math_pass' | 'ai_alert'): Promise<AlertSignal[]> {
  const url = level ? `${API_URL}/api/v1/signals?level=${level}` : `${API_URL}/api/v1/signals`;
  const res = await fetch(url, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}
