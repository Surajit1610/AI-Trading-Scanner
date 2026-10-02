import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  marketCap: number;
  volume: number;
  changePct: number;
}

export async function fetchQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const sanitizedTicker = ticker.replace('/', '-').toUpperCase();
    const result = await yahooFinance.quote(sanitizedTicker);
    return {
      marketCap: result.marketCap || 0,
      volume: result.regularMarketVolume || 0,
      changePct: result.regularMarketChangePercent || 0
    };
  } catch (error) {
    console.error(`[MarketData] Failed to fetch quote for ${ticker}:`, error);
    return null;
  }
}


export async function searchAssets(query: string) {
  try {
    const result = await yahooFinance.search(query);
    return result.quotes.filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'CRYPTOCURRENCY' || q.quoteType === 'CURRENCY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX').map(q => {
      let category = 'stock';
      if (q.quoteType === 'CRYPTOCURRENCY') category = 'crypto';
      if (q.quoteType === 'CURRENCY') category = 'forex';
      if (q.quoteType === 'ETF' || q.quoteType === 'INDEX') category = 'index';
      
      // Fix crypto tickers like BTC-USD to BTC/USD to match our backend format
      let ticker = String(q.symbol);
      if (category === 'crypto' || category === 'forex') {
         ticker = ticker.replace('-', '/');
      }

      return {
        _id: ticker,
        ticker: ticker,
        name: q.shortname || q.longname || q.symbol,
        category,
        exchange: q.exchange || 'Unknown'
      };
    });
  } catch (error) {
    console.error(`[MarketData] Failed to search for ${query}:`, error);
    return [];
  }
}

export async function fetchCandles(ticker: string, timeframe: string, limit: number = 250): Promise<Candle[]> {
  try {
    // Sanitize the ticker for Yahoo Finance (e.g. BTC/USD -> BTC-USD)
    const sanitizedTicker = ticker.replace('/', '-').toUpperCase();

    // Map our timeframe strings to Yahoo Finance intervals
    type YFInterval = "1m"|"2m"|"5m"|"15m"|"30m"|"60m"|"90m"|"1h"|"1d"|"5d"|"1wk"|"1mo"|"3mo";
    const intervalMap: Record<string, YFInterval> = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
      '1h': '60m', '4h': '60m', // Yahoo doesn't support 4h natively; we fetch 60m and get enough candles
      '1d': '1d', '1wk': '1wk', '1mo': '1mo'
    };
    const interval: YFInterval = intervalMap[timeframe.toLowerCase()] || '1d';

    // Calculate how far back we need to go to get `limit` candles accounting for market closures
    const now = new Date();
    let msLookback: number;
    switch (interval) {
      case '1m':  msLookback = 1  * 60 * 1000 * limit * 4; break;   // 4x buffer for market gaps
      case '5m':  msLookback = 5  * 60 * 1000 * limit * 3; break;
      case '15m': msLookback = 15 * 60 * 1000 * limit * 3; break;
      case '30m': msLookback = 30 * 60 * 1000 * limit * 3; break;
      case '60m': msLookback = 60 * 60 * 1000 * limit * 3; break;
      case '1d':  msLookback = 24 * 60 * 60 * 1000 * limit * 1.5; break;
      case '1wk': msLookback = 7  * 24 * 60 * 60 * 1000 * limit * 1.5; break;
      case '1mo': msLookback = 30 * 24 * 60 * 60 * 1000 * limit * 1.2; break;
      default:    msLookback = 24 * 60 * 60 * 1000 * limit * 1.5;
    }

    const period1 = new Date(now.getTime() - msLookback);

    const queryOptions: any = {
      period1: period1,
      period2: now,
      interval: interval
    };

    console.log(`[MarketData] Fetching ${sanitizedTicker} (original: ${ticker}) for interval ${interval}...`);
    const result: any = await yahooFinance.chart(sanitizedTicker, queryOptions);
    
    if (!result || !result.quotes || result.quotes.length === 0) {
      console.warn(`[MarketData] No data returned from Yahoo Finance for ${sanitizedTicker}`);
      return [];
    }

    // Map Yahoo Finance data to our Candle interface
    const formattedCandles: Candle[] = result.quotes
      .filter((q: any) => q.open !== null && q.close !== null) // Filter out null periods
      .map((q: any) => ({
        timestamp: (q.date as Date).toISOString(),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: q.volume as number
      }));

    // Return exactly the `limit` number of candles (taking the most recent ones)
    return formattedCandles.slice(-limit);

  } catch (error) {
    console.error(`[MarketData] Failed to fetch live data for ${ticker}:`, error);
    return [];
  }
}

export async function fetchTopMovers(category: 'stocks' | 'crypto' | 'forex', type: 'gainers' | 'losers', count: number = 30): Promise<string[]> {
  try {
    console.log(`[MarketData] Fetching Top ${count} ${type} for ${category}...`);

    if (category === 'crypto') {
      // Use CoinGecko for reliable crypto top movers (Top 100 by market cap)
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
      if (!response.ok) throw new Error(`CoinGecko HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      data.sort((a: any, b: any) => {
        const diff = (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0);
        return type === 'gainers' ? diff : -diff;
      });

      // CoinGecko symbols are like 'btc'. Convert to 'BTC/USD'
      return data.slice(0, count).map((coin: any) => `${coin.symbol.toUpperCase()}/USD`);
    }

    if (category === 'stocks') {
      // Indian Stocks (Nifty 50 constituents)
      const nifty50 = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", "INFY.NS", "ITC.NS", "SBIN.NS", "LT.NS", "BAJFINANCE.NS", 
        "HINDUNILVR.NS", "AXISBANK.NS", "KOTAKBANK.NS", "ADANIENT.NS", "MARUTI.NS", "SUNPHARMA.NS", "ASIANPAINT.NS", "TITAN.NS", 
        "ULTRACEMCO.NS", "BAJAJFINSV.NS", "TATASTEEL.NS", "WIPRO.NS", "NTPC.NS", "NESTLEIND.NS", "ONGC.NS", "HCLTECH.NS", "POWERGRID.NS", 
        "M&M.NS", "ADANIPORTS.NS", "HINDALCO.NS", "TECHM.NS", "GRASIM.NS", "COALINDIA.NS", "CIPLA.NS", "JSWSTEEL.NS", "SBILIFE.NS", 
        "DRREDDY.NS", "TATAMOTORS.NS", "HDFCLIFE.NS", "BRITANNIA.NS", "INDUSINDBK.NS", "BAJAJ-AUTO.NS", "EICHERMOT.NS", "DIVISLAB.NS", 
        "APOLLOHOSP.NS", "TATACONSUM.NS", "HEROMOTOCO.NS", "UPL.NS", "BPCL.NS"
      ];
      
      const quotes = await yahooFinance.quote(nifty50);
      quotes.sort((a, b) => {
        const diff = (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0);
        return type === 'gainers' ? diff : -diff;
      });

      return quotes.slice(0, count).map(q => q.symbol);
    }

    if (category === 'forex') {
      const forexPairs = [
        "EURUSD=X", "JPY=X", "GBPUSD=X", "AUDUSD=X", "NZDUSD=X", "EURJPY=X", "GBPJPY=X", "EURGBP=X", 
        "EURCAD=X", "EURSEK=X", "EURCHF=X", "EURHUF=X", "CNY=X", "HKD=X", "SGD=X", "INR=X", "MXN=X"
      ];
      
      const quotes = await yahooFinance.quote(forexPairs);
      quotes.sort((a, b) => {
        const diff = (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0);
        return type === 'gainers' ? diff : -diff;
      });

      return quotes.slice(0, count).map(q => {
        // e.g. "EURUSD=X" -> "EUR/USD"
        // e.g. "JPY=X" -> "USD/JPY"
        if (q.symbol === 'JPY=X') return 'USD/JPY';
        if (q.symbol === 'CNY=X') return 'USD/CNY';
        if (q.symbol === 'HKD=X') return 'USD/HKD';
        if (q.symbol === 'SGD=X') return 'USD/SGD';
        if (q.symbol === 'INR=X') return 'USD/INR';
        if (q.symbol === 'MXN=X') return 'USD/MXN';
        
        const clean = q.symbol.replace('=X', '');
        return `${clean.substring(0, 3)}/${clean.substring(3, 6)}`;
      });
    }

    return [];
  } catch (error) {
    console.error(`[MarketData] Failed to fetch top ${type} for ${category}:`, error);
    return [];
  }
}
