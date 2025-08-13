import dotenv from "dotenv";
import Sentiment from "sentiment";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const sentimentLib = new Sentiment();

// Initialize GoogleGenerativeAI with proper error handling
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required in environment variables");
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---- EMBEDDINGS ----
export async function embedText(text) {
  try {
    const model = ai.getGenerativeModel({ model: "models/text-embedding-004" });
    const resp = await model.embedContent(text);
    return resp.embedding.values;
  } catch (error) {
    console.error("Error in embedText:", error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

// ---- GENERATION ----
export async function generateResponse({ userMessage, contextDocs = [] }) {
  try {
    const systemInstruction = `You are an empathetic customer support assistant. Based on the provided knowledge base documents and user message, provide a helpful response. Return your response as JSON with the following structure: { "answer": "your helpful response", "empathy": "empathetic message if needed", "escalation": true/false, "priority": "low/normal/high" }.`;

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
  } catch (error) {
    console.error("Error in generateResponse:", error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

// ---- QUICK SENTIMENT ----
export function quickSentiment(text) {
  const r = sentimentLib.analyze(text);
  if (r.score > 2) return "positive";
  if (r.score < -2) return "negative";
  return "neutral";
}
