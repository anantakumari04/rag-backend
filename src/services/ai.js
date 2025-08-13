import dotenv from "dotenv";
import Sentiment from "sentiment";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const sentimentLib = new Sentiment();
const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

// ---- EMBEDDINGS ----
export async function embedText(text) {
  const model = ai.getGenerativeModel({ model: "models/embedding-001" });
  const resp = await model.embedContent(text);
  return resp.embedding;
}

// ---- GENERATION ----
export async function generateResponse({ userMessage, contextDocs = [] }) {
  const systemInstruction = `You are an empathetic customer support assistant... Return JSON: { answer, empathy, escalation, priority }.`;

  const docs = contextDocs.map(
    (d, i) => `DOC ${i + 1} TITLE: ${d.title}\n${d.content}`
  );

  const prompt = [systemInstruction, ...docs, `USER: ${userMessage}`].join("\n\n");

  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  try {
    return { raw, parsed: JSON.parse(raw) };
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try { return { raw, parsed: JSON.parse(m[0]) }; } catch {}
    }
    const s = sentimentLib.analyze(userMessage);
    return {
      raw,
      parsed: {
        answer: raw,
        empathy: "",
        escalation: s.score <= -3,
        priority: "normal",
      },
    };
  }
}

// ---- QUICK SENTIMENT ----
export function quickSentiment(text) {
  const r = sentimentLib.analyze(text);
  if (r.score > 2) return "positive";
  if (r.score < -2) return "negative";
  return "neutral";
}
