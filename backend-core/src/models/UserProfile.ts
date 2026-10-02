import mongoose, { Schema, Document } from 'mongoose';

export interface IToolsConfig {
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

export interface IStrategy {
  id: string;
  name: string;
  isActive: boolean;
  useAI: boolean;
  indicators: IToolsConfig;
}

export interface IAutoScanConfig {
  stocks: { gainers: boolean; losers: boolean };
  crypto: { gainers: boolean; losers: boolean };
  forex: { gainers: boolean; losers: boolean };
}

export interface IUserProfile extends Document {
  userId: string;
  savedTickers: string[];
  strategies: IStrategy[];
  autoScan: IAutoScanConfig;
  preferredTimeframe: string;
  preferredBroker: string;
  notificationEmail: string;
}

const UserProfileSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    savedTickers: { type: [String], default: [] },
    strategies: {
      type: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        useAI: { type: Boolean, default: true },
        indicators: {
          ema200: { enabled: { type: Boolean, default: false }, tolerance_pct: { type: Number, default: 0.5 } },
          ema_cross: { enabled: { type: Boolean, default: false }, fast_period: { type: Number, default: 20 }, slow_period: { type: Number, default: 50 } },
          volume_spike: { enabled: { type: Boolean, default: false }, multiplier: { type: Number, default: 1.5 } },
          support_resistance: { enabled: { type: Boolean, default: false }, window: { type: Number, default: 20 } },
          fundamentals: { enabled: { type: Boolean, default: false }, min_volume: { type: Number, default: 1000000 }, min_market_cap: { type: Number, default: 50000000000 }, min_change_pct: { type: Number, default: 0.5 }, max_change_pct: { type: Number, default: 2.5 } },
          stochastic: { enabled: { type: Boolean, default: false }, oversold_threshold: { type: Number, default: 20 } },
          williams_r: { enabled: { type: Boolean, default: false }, oversold_threshold: { type: Number, default: -80 } },
          bollinger_bands: { enabled: { type: Boolean, default: false }, tolerance_pct: { type: Number, default: 1.5 } },
          vwap: { enabled: { type: Boolean, default: false }, require_above: { type: Boolean, default: true } },
          macd: { enabled: { type: Boolean, default: false }, require_positive_hist: { type: Boolean, default: true }, fast: { type: Number, default: 12 }, slow: { type: Number, default: 26 }, signal: { type: Number, default: 9 } },
          ichimoku: { enabled: { type: Boolean, default: false }, condition: { type: String, default: 'above_cloud' } },
          rsi: { enabled: { type: Boolean, default: false }, period: { type: Number, default: 14 }, condition: { type: String, default: 'oversold' }, threshold: { type: Number, default: 30 } },
          open_interest: { enabled: { type: Boolean, default: false }, condition: { type: String, default: 'highest' } }
        }
      }],
      default: []
    },
    autoScan: {
      stocks: {
        gainers: { type: Boolean, default: false },
        losers: { type: Boolean, default: false }
      },
      crypto: {
        gainers: { type: Boolean, default: false },
        losers: { type: Boolean, default: false }
      },
      forex: {
        gainers: { type: Boolean, default: false },
        losers: { type: Boolean, default: false }
      }
    },
    preferredTimeframe: { type: String, default: '15m' },
    preferredBroker: { type: String, default: 'TradingView' },
    notificationEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
