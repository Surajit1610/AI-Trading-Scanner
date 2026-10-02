import mongoose from 'mongoose';
import AssetCatalog from './dist/models/AssetCatalog.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const MONGO_URI = mongodb://:@localhost:27017/trading_db?authSource=admin;

const indianStocks = [
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'SBIN.NS', name: 'State Bank of India', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'AXISBANK.NS', name: 'Axis Bank', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'INFY.NS', name: 'Infosys', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'ITC.NS', name: 'ITC Limited', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'TATAMOTORS.NS', name: 'Tata Motors', category: 'stock', exchange: 'NSE', isActive: true },
  { ticker: 'ZOMATO.NS', name: 'Zomato', category: 'stock', exchange: 'NSE', isActive: true }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    for (const stock of indianStocks) {
      await AssetCatalog.updateOne({ ticker: stock.ticker }, { $set: stock }, { upsert: true });
    }
    console.log('Seeded Indian Stocks!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
