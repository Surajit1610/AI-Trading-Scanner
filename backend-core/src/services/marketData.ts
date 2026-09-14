export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchCandles(ticker: string, timeframe: string, limit: number = 250): Promise<Candle[]> {
  // Mock generator for development purposes
  // In production, this would call Yahoo Finance, Binance, or Polygon API.
  const candles: Candle[] = [];
  const basePrice = Math.random() * 200 + 50; // Random starting price between 50 and 250
  
  let currentPrice = basePrice;
  const now = new Date();
  
  // Calculate a time decrement based on timeframe (mocking generic steps)
  let msDecrement = 60 * 60 * 1000; // default 1h
  if (timeframe === '15m') msDecrement = 15 * 60 * 1000;
  if (timeframe === '1d' || timeframe === '1D') msDecrement = 24 * 60 * 60 * 1000;

  // Generate candles backwards, then reverse
  for (let i = limit; i > 0; i--) {
    const isBullish = Math.random() > 0.45; // slight upward bias
    const volatility = currentPrice * 0.02; // 2% volatility
    
    const change = (Math.random() * volatility) * (isBullish ? 1 : -1);
    const open = currentPrice;
    const close = currentPrice + change;
    
    const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
    const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
    const volume = Math.floor(Math.random() * 10000) + 1000;
    
    // Some random volume spikes
    const spike = Math.random() > 0.95 ? 5 : 1; 
    
    const timestamp = new Date(now.getTime() - (i * msDecrement)).toISOString();
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume: volume * spike
    });
    
    currentPrice = close;
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return candles;
}
