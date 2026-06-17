import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdfs.js";

dotenv.config();

const app = express();

function parseCorsOrigins(value) {
  if (!value) return true;
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(
  cors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    credentials: true,
  }),
);
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
