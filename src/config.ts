import dotenv from "dotenv";

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
  },
  huggingFace: {
    apiKey: process.env.HUGGING_FACE_ACCESS_TOKEN ?? "",
  },
  database: {
    url: process.env.DATABASE_URL ?? "",
  },
  server: {
    port: parseInt(process.env.PORT ?? "3001", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
  },
};

const requiredEnvVars = [
  "OPENROUTER_API_KEY",
  "HUGGING_FACE_ACCESS_TOKEN",
  "DATABASE_URL",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} is not set in environment variables`);
  }
}
