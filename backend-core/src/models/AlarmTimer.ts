import mongoose, { Schema, Document } from 'mongoose';

export interface IAlarmTimer extends Document {
  userId: string;
  time: string; // Format: "HH:mm"
  isActive: boolean;
}

const AlarmTimerSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    time: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAlarmTimer>('AlarmTimer', AlarmTimerSchema);
