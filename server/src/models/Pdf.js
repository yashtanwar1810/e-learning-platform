import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  { question: String, answer: String },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    question: String,
    options: [String],
    answerIndex: Number,
    explanation: String,
  },
  { _id: false },
);

const pdfSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: String,
    originalName: String,
    filename: String,
    path: String,
    size: Number,
    pages: Number,
    text: { type: String, select: false },
    summary: String,
    flashcards: [flashcardSchema],
    quiz: [quizSchema],
  },
  { timestamps: true },
);

export default mongoose.model("Pdf", pdfSchema);
