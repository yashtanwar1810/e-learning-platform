import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdfs.js";

dotenv.config();

const app = express();

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://e-learning-platform-ashen-eta.vercel.app",
];

function normalizeOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function parseCorsOrigins(...values) {
  return values
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);
}

const allowedOrigins = new Set(
  parseCorsOrigins(DEFAULT_ALLOWED_ORIGINS.join(","), process.env.CORS_ORIGIN),
);
const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS === "true";
const vercelPreviewOriginPattern = /^https:\/\/e-learning-platform-[a-z0-9-]+\.vercel\.app$/;

function isAllowedOrigin(origin) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;
  if (allowedOrigins.has(normalizedOrigin)) return true;
  return allowVercelPreviews && vercelPreviewOriginPattern.test(normalizedOrigin);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});
