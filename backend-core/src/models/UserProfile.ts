import mongoose, { Schema, Document } from 'mongoose';

export interface IToolsConfig {
  ema200: { enabled: boolean; tolerance_pct: number };
  ema_cross: { enabled: boolean; fast_period: number; slow_period: number };
  volume_spike: { enabled: boolean; multiplier: number };
  support_resistance: { enabled: boolean; window: number };
}

export interface IUserProfile extends Document {
  userId: string;
  savedTickers: string[];
  savedIndicators: IToolsConfig;
  preferredTimeframe: string;
  preferredBroker: string;
  notificationEmail: string;
}

const UserProfileSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    savedTickers: { type: [String], default: [] },
    savedIndicators: {
      ema200: {
        enabled: { type: Boolean, default: false },
        tolerance_pct: { type: Number, default: 0.5 },
      },
      ema_cross: {
        enabled: { type: Boolean, default: false },
        fast_period: { type: Number, default: 20 },
        slow_period: { type: Number, default: 50 },
      },
      volume_spike: {
        enabled: { type: Boolean, default: false },
        multiplier: { type: Number, default: 1.5 },
      },
      support_resistance: {
        enabled: { type: Boolean, default: false },
        window: { type: Number, default: 20 },
      },
    },
    preferredTimeframe: { type: String, default: '15m' },
    preferredBroker: { type: String, default: 'Sahi' },
    notificationEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
