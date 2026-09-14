export type MongoEnv = Partial<NodeJS.ProcessEnv>;

export function buildMongoUri(env: MongoEnv = process.env): string {
  if (env.MONGO_URI) {
    return env.MONGO_URI;
  }

  const username = env.MONGO_USERNAME;
  const password = env.MONGO_PASSWORD;

  if (username && password) {
    const safeUser = encodeURIComponent(username);
    const safePass = encodeURIComponent(password);
    return `mongodb://${safeUser}:${safePass}@mongo:27017/trading_db?authSource=admin`;
  }

  return 'mongodb://mongo:27017/trading_db';
}
