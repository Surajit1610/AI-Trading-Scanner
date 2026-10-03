import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import profileRoutes from './routes/profile.js';
import alarmRoutes from './routes/alarms.js';
import signalRoutes from './routes/signals.js';
import assetRoutes from './routes/assets.js';
import adminRoutes from './routes/admin.js';
import { buildMongoUri } from './config/mongoUri.js';

// Import the worker so it starts listening on boot
import './queues/scannerWorker.js';

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = buildMongoUri(process.env);

// Allow CORS for the frontend (Dynamic for Production)
const allowedOrigin = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', profileRoutes);
app.use('/api', alarmRoutes);
app.use('/api', signalRoutes);
app.use('/api', assetRoutes);
app.use('/api', adminRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend-core' });
});

// Database Connection
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    app.listen(port, () => {
      console.log(`[Express] Backend Core listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err);
    process.exit(1);
  });
