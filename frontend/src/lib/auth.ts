import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

import { Resend } from "resend";

// Safely build mongo URL
const username = encodeURIComponent(process.env.MONGO_USERNAME || "root");
const password = encodeURIComponent(process.env.MONGO_PASSWORD || "example");
const mongoUrl = process.env.MONGO_URI || `mongodb://${username}:${password}@mongo:27017/trading_db?authSource=admin`;
const client = new MongoClient(mongoUrl);
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: mongodbAdapter(client.db("trading_db")),
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            },
            accountStatus: {
                type: "string",
                required: false,
                defaultValue: "pending"
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        sendResetPassword: async ({ user, url }) => {
            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ONBOARDING || "Scanner <onboarding@resend.dev>",
                to: user.email,
                subject: "Reset your password",
                html: `
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password:</p>
                    <a href="${url}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                `
            });
            if (error) {
                console.error("Resend API Error (Reset Password):", error);
                throw new Error("Failed to send reset password email.");
            }
        }
    },
    emailVerification: {
        sendOnSignUp: false,
        sendVerificationEmail: async ({ user, url }) => {
            const { data, error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ONBOARDING || "Scanner <onboarding@resend.dev>",
                to: user.email,
                subject: "Verify your email address",
                html: `
                    <h2>Welcome to AI Trading Scanner!</h2>
                    <p>Click the link below to verify your email address:</p>
                    <a href="${url}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                `
            });
            if (error) {
                console.error("Resend API Error:", error);
                throw new Error("Failed to send verification email. Please check API Key and Sender Domain.");
            }
        }
    },
    // Placeholders for future Google OAuth integration
    socialProviders: {
    }
});
