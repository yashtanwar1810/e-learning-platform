import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import pdfParsePkg from "pdf-parse";
import auth from "../middleware/auth.js";
import Pdf from "../models/Pdf.js";
import * as gemini from "../services/gemini.js";

const { PDFParse } = pdfParsePkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { text: result.text || "", pages: result.total || 0 };
  } finally {
    try {
      await parser.destroy();
    } catch (error) {
      console.warn("Failed to release PDF parser:", error.message);
    }
  }
}

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]+/gi, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.use(auth);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getUploadedFile(req) {
  return req.files?.pdf?.[0] ?? req.files?.file?.[0] ?? null;
}

async function removeFile(filePath) {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      console.warn("Failed to delete file:", error.message);
    }
  }
}

async function getOwned(req, res, withText = false) {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: "Invalid PDF id" });
    return null;
  }

  const query = Pdf.findOne({ _id: req.params.id, user: req.user._id });
  if (withText) query.select("+text");
  const pdf = await query.exec();
  if (!pdf) {
    res.status(404).json({ message: "Not found" });
    return null;
  }

  return pdf;
}

router.get("/", async (req, res, next) => {
  try {
    const pdfs = await Pdf.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ message: error.message || "Upload failed" });
    }

    const file = getUploadedFile(req);
    let createdPdf = null;

    try {
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const buffer = await fsp.readFile(file.path);
      let text = "";
      let pages = 0;

      try {
        const parsed = await extractPdfText(buffer);
        text = parsed.text;
        pages = parsed.pages;
      } catch (parseError) {
        console.warn("pdf-parse failed:", parseError.message);
      }

      createdPdf = await Pdf.create({
        user: req.user._id,
        title: file.originalname.replace(/\.pdf$/i, "") || "Untitled",
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        pages,
        text,
      });

      res.status(201).json(createdPdf);
    } catch (routeError) {
      if (!createdPdf) {
        await removeFile(file?.path);
      }
      next(routeError);
    }
  });
});

router.get("/:id", async (req, res, next) => {
  try {
    const pdf = await getOwned(req, res);
    if (!pdf) return;
    res.json(pdf);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const pdf = await getOwned(req, res);
    if (!pdf) return;
    await removeFile(pdf.path);
    await pdf.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/summary", async (req, res, next) => {
  try {
    const pdf = await getOwned(req, res, true);
    if (!pdf) return;
    const force = req.query.force === "1" || req.query.force === "true";
    if (!pdf.summary || force) {
      pdf.summary = await gemini.generateSummary(pdf.text || "");
      await pdf.save();
    }
    res.json({ summary: pdf.summary });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/flashcards", async (req, res, next) => {
  try {
    const pdf = await getOwned(req, res, true);
    if (!pdf) return;
    const force = req.query.force === "1" || req.query.force === "true";
    if (force || !pdf.flashcards || pdf.flashcards.length === 0) {
      pdf.flashcards = await gemini.generateFlashcards(pdf.text || "");
      await pdf.save();
    }
    res.json({ flashcards: pdf.flashcards });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/quiz", async (req, res, next) => {
  try {
    const pdf = await getOwned(req, res, true);
    if (!pdf) return;
    const force = req.query.force === "1" || req.query.force === "true";
    if (force || !pdf.quiz || pdf.quiz.length === 0) {
      pdf.quiz = await gemini.generateQuiz(pdf.text || "");
      await pdf.save();
    }
    res.json({ quiz: pdf.quiz });
  } catch (error) {
    next(error);
  }
});

export default router;
