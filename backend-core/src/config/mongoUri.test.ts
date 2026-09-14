import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMongoUri } from './mongoUri.js';

test('buildMongoUri falls back to the internal MongoDB service on Docker networks', () => {
  const uri = buildMongoUri({
    MONGO_HOST: 'mongo',
    MONGO_PORT: '27017',
    MONGO_DB: 'trading_db',
  } as NodeJS.ProcessEnv);

  assert.equal(uri, 'mongodb://mongo:27017/trading_db');
});

test('buildMongoUri preserves an explicit MONGO_URI when provided', () => {
  const uri = buildMongoUri({
    MONGO_URI: 'mongodb://mongo:27017/trading_db',
  } as NodeJS.ProcessEnv);

  assert.equal(uri, 'mongodb://mongo:27017/trading_db');
});
