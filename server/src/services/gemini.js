import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
].filter(Boolean);

function client() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function model(name) {
  return client().getGenerativeModel({ model: name });
}

function trim(text, max = 18000) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) : text;
}

function stripCodeFences(text) {
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
}

function parseJson(text) {
  const cleaned = stripCodeFences(text.trim());
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI returned invalid JSON");
  }
}

async function runText(prompt) {
  return runWithFallback(async (name) => {
    const res = await model(name).generateContent(prompt);
    return res.response.text();
  });
}

async function runJson(prompt) {
  return runWithFallback(async (name) => {
    const m = client().getGenerativeModel({
      model: name,
      generationConfig: { responseMimeType: "application/json" },
    });
    const res = await m.generateContent(prompt);
    return parseJson(res.response.text());
  });
}

function isModelNotFoundError(error) {
  const message = String(error?.message || "");
  return (
    error?.status === 404 ||
    /404 Not Found/i.test(message) ||
    /models\/[^ ]+ is not found/i.test(message) ||
    /not supported for generateContent/i.test(message)
  );
}

async function runWithFallback(execute) {
  let lastError;
  for (const name of MODEL_CANDIDATES) {
    try {
      return await execute(name);
    } catch (error) {
      lastError = error;
      if (!isModelNotFoundError(error)) throw error;
    }
  }
  throw lastError || new Error("No Gemini models are available");
}

export function generateSummary(text) {
  const cleaned = trim(text);
  if (!cleaned) return Promise.resolve("No extractable text was found in the PDF.");
  return runText(
    `Write a clear, well-structured study summary of the following document. Use short paragraphs and bullet points where useful. Keep it under 400 words.\n\n---\n${cleaned}`,
  );
}

export async function generateFlashcards(text) {
  const cleaned = trim(text);
  if (!cleaned) return [];
  const data = await runJson(
    `From the document below, create 10 study flashcards. Return ONLY a JSON array of objects with keys "question" and "answer". Keep each answer 1-2 sentences.\n\n---\n${cleaned}`,
  );
  const arr = Array.isArray(data) ? data : data.flashcards || data.cards || [];
  return arr
    .filter((card) => card && card.question && card.answer)
    .map((card) => ({ question: String(card.question), answer: String(card.answer) }));
}

export async function generateQuiz(text) {
  const cleaned = trim(text);
  if (!cleaned) return [];
  const data = await runJson(
    `From the document below, create 8 multiple-choice quiz questions. Return ONLY a JSON array of objects with keys "question" (string), "options" (array of exactly 4 strings), "answerIndex" (0-3 integer pointing to the correct option), and "explanation" (1 sentence).\n\n---\n${cleaned}`,
  );
  const arr = Array.isArray(data) ? data : data.quiz || data.questions || [];
  return arr
    .filter(
      (question) =>
        question &&
        question.question &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        Number.isInteger(question.answerIndex) &&
        question.answerIndex >= 0 &&
        question.answerIndex < 4,
    )
    .map((question) => ({
      question: String(question.question),
      options: question.options.map(String),
      answerIndex: question.answerIndex,
      explanation: question.explanation ? String(question.explanation) : "",
    }));
}
