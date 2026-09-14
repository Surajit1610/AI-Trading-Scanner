import { Router } from 'express';
import AssetCatalog from '../models/AssetCatalog.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/assets', requireAuth, async (req, res) => {
  try {
    let assets = await AssetCatalog.find({ isActive: true });
    
    // Auto-seed basic assets if the catalog is empty (for development convenience)
    if (assets.length === 0) {
      const seedData = [
        { ticker: 'AAPL', name: 'Apple Inc.', category: 'stock', exchange: 'NASDAQ' },
        { ticker: 'MSFT', name: 'Microsoft Corp.', category: 'stock', exchange: 'NASDAQ' },
        { ticker: 'TSLA', name: 'Tesla Inc.', category: 'stock', exchange: 'NASDAQ' },
        { ticker: 'NVDA', name: 'NVIDIA Corp.', category: 'stock', exchange: 'NASDAQ' },
        { ticker: 'BTC/USD', name: 'Bitcoin', category: 'crypto', exchange: 'Crypto' },
        { ticker: 'ETH/USD', name: 'Ethereum', category: 'crypto', exchange: 'Crypto' },
        { ticker: 'SOL/USD', name: 'Solana', category: 'crypto', exchange: 'Crypto' },
        { ticker: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', exchange: 'Forex' },
        { ticker: 'GBP/USD', name: 'British Pound / US Dollar', category: 'forex', exchange: 'Forex' },
        { ticker: 'SPY', name: 'SPDR S&P 500 ETF', category: 'index', exchange: 'NYSE' },
      ];
      await AssetCatalog.insertMany(seedData);
      assets = await AssetCatalog.find({ isActive: true });
    }
    
    res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

export default router;
