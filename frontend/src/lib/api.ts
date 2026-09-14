export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ToolsConfig {
  ema200: { enabled: boolean; tolerance_pct: number };
  ema_cross: { enabled: boolean; fast_period: number; slow_period: number };
  volume_spike: { enabled: boolean; multiplier: number };
  support_resistance: { enabled: boolean; window: number };
}

export interface UserProfileData {
  userId?: string;
  savedTickers: string[];
  savedIndicators: ToolsConfig;
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
  score: number;
  verdict: string;
  rationale: string;
  activeIndicators: Record<string, any>;
  createdAt: string;
}

export async function getAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_URL}/api/assets`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function getProfile(): Promise<UserProfileData> {
  const res = await fetch(`${API_URL}/api/profile`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(data: Partial<UserProfileData>): Promise<UserProfileData> {
  const res = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function triggerImmediateScan(): Promise<any> {
  const res = await fetch(`${API_URL}/api/scan/trigger`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to trigger scan');
  return res.json();
}

export async function getAlarms(): Promise<AlarmTimer[]> {
  const res = await fetch(`${API_URL}/api/alarms`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch alarms');
  return res.json();
}

export async function createAlarm(time: string): Promise<AlarmTimer> {
  const res = await fetch(`${API_URL}/api/alarms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to create alarm');
  return res.json();
}

export async function toggleAlarm(id: string, isActive: boolean): Promise<AlarmTimer> {
  const res = await fetch(`${API_URL}/api/alarms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to toggle alarm');
  return res.json();
}

export async function deleteAlarm(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/alarms/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete alarm');
}

export async function getSignals(): Promise<AlertSignal[]> {
  const res = await fetch(`${API_URL}/api/signals`, { next: { revalidate: 0 }, credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch signals');
  return res.json();
}
