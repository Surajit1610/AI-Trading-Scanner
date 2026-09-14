import mongoose, { Schema, Document } from 'mongoose';

export interface IAlertSignal extends Document {
  userId: string;
  ticker: string;
  timeframe: string;
  score: number;
  verdict: string;
  rationale: string;
  activeIndicators: Record<string, any>;
  sentAt: Date;
}

const AlertSignalSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    ticker: { type: String, required: true },
    timeframe: { type: String, required: true },
    score: { type: Number, required: true },
    verdict: { type: String, required: true },
    rationale: { type: String, required: true },
    activeIndicators: { type: Schema.Types.Mixed, default: {} },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IAlertSignal>('AlertSignal', AlertSignalSchema);
