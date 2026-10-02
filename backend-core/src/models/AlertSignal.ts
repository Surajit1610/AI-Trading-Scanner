import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertSignal extends Document {
  userId: string;
  ticker: string;
  timeframe: string;
  strategyName: string;
  level: 'math_pass' | 'ai_alert';
  activeIndicators: Record<string, any>;
  // AI-specific fields — null for math_pass events
  score: number | null;
  verdict: string | null;
  rationale: string | null;
  sentAt: Date;
}

const AlertSignalSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    ticker: { type: String, required: true },
    timeframe: { type: String, required: true },
    strategyName: { type: String, default: 'Default Strategy' },
    level: { type: String, enum: ['math_pass', 'ai_alert'], default: 'ai_alert' },
    activeIndicators: { type: Schema.Types.Mixed, default: {} },
    score: { type: Number, default: null },
    verdict: { type: String, default: null },
    rationale: { type: String, default: null },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for fast per-user queries filtered by level
AlertSignalSchema.index({ userId: 1, level: 1, createdAt: -1 });

export default mongoose.model<IAlertSignal>('AlertSignal', AlertSignalSchema);
