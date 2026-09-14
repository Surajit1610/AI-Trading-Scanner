import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Safely build mongo URL
const username = encodeURIComponent(process.env.MONGO_USERNAME || "root");
const password = encodeURIComponent(process.env.MONGO_PASSWORD || "example");
const mongoUrl = process.env.MONGO_URI || `mongodb://${username}:${password}@mongo:27017/trading_db?authSource=admin`;
const client = new MongoClient(mongoUrl);

export const auth = betterAuth({
    database: mongodbAdapter(client.db()),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
    },
    // Placeholders for future Google OAuth integration
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    }
});
