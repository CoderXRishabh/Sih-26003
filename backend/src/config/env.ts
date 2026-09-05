import dotenv from "dotenv";
dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/smriti?schema=public",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-in-production",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production",
  PORT: parseInt(process.env.PORT || "4000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:8443",

  // AI API Keys
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY || "",

  // AI Model Names (configurable, not hardcoded)
  WHISPER_MODEL: process.env.WHISPER_MODEL || "whisper-large-v3-turbo",
  NEMOTRON_MODEL: process.env.NEMOTRON_MODEL || "meta/llama-3.2-11b-vision-instruct",

  // Token lifetimes
  ACCESS_TOKEN_EXPIRY: "15m",
  PATIENT_REFRESH_EXPIRY: "90d",   // Long-lived for elderly — single setup login
  CAREGIVER_REFRESH_EXPIRY: "7d",

  // Bcrypt
  BCRYPT_SALT_ROUNDS: 12,
} as const;
