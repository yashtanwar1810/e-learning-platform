const { GoogleGenerativeAI } = require("@google/generative-ai");

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

exports.generateSummary = (text) => {
  const cleaned = trim(text);
  if (!cleaned) return Promise.resolve("No extractable text was found in the PDF.");
  return runText(
    `Write a clear, well-structured study summary of the following document. Use short paragraphs and bullet points where useful. Keep it under 400 words.\n\n---\n${cleaned}`
  );
};

exports.generateFlashcards = async (text) => {
  const cleaned = trim(text);
  if (!cleaned) return [];
  const data = await runJson(
    `From the document below, create 10 study flashcards. Return ONLY a JSON array of objects with keys "question" and "answer". Keep each answer 1-2 sentences.\n\n---\n${cleaned}`
  );
  const arr = Array.isArray(data) ? data : data.flashcards || data.cards || [];
  return arr
    .filter((c) => c && c.question && c.answer)
    .map((c) => ({ question: String(c.question), answer: String(c.answer) }));
};

exports.generateQuiz = async (text) => {
  const cleaned = trim(text);
  if (!cleaned) return [];
  const data = await runJson(
    `From the document below, create 8 multiple-choice quiz questions. Return ONLY a JSON array of objects with keys "question" (string), "options" (array of exactly 4 strings), "answerIndex" (0-3 integer pointing to the correct option), and "explanation" (1 sentence).\n\n---\n${cleaned}`
  );
  const arr = Array.isArray(data) ? data : data.quiz || data.questions || [];
  return arr
    .filter(
      (q) =>
        q &&
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.answerIndex) &&
        q.answerIndex >= 0 &&
        q.answerIndex < 4
    )
    .map((q) => ({
      question: String(q.question),
      options: q.options.map(String),
      answerIndex: q.answerIndex,
      explanation: q.explanation ? String(q.explanation) : "",
    }));
};
