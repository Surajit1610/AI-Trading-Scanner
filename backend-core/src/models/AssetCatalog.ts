import mongoose, { Schema, Document } from 'mongoose';

export interface IAssetCatalog extends Document {
  ticker: string;
  name: string;
  category: 'crypto' | 'forex' | 'stock' | 'index';
  exchange?: string;
  isActive: boolean;
}

const AssetCatalogSchema: Schema = new Schema(
  {
    ticker: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['crypto', 'forex', 'stock', 'index'], required: true },
    exchange: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model<IAssetCatalog>('AssetCatalog', AssetCatalogSchema);
