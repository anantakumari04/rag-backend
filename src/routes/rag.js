import express from 'express';
import { embedText, generateResponse, quickSentiment } from '../services/ai.js';
import { initVectorStore, queryTopK } from '../services/vectorStore.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

router.post('/respond', async (req, res) => {
  try {
    await initVectorStore();
    const { message, ticketId } = req.body;
    if(!message) return res.status(400).send({ error: 'message required' });

    // 1) embed user message
    const emb = await embedText(message);

    // 2) query vector DB for relevant docs
    const docs = await queryTopK(emb, 4);

    // 3) get model-generated answer + metadata (empathy, escalation)
    const { raw, parsed } = await generateResponse({ userMessage: message, contextDocs: docs });

    // 4) quick sentiment
    const sentiment = quickSentiment(message);

    // 5) if a ticket is attached, append assistant message and update escalation/sentiment
    if (ticketId) {
      const t = await Ticket.findById(ticketId);
      if (t) {
        const assistantMessage = { role: 'assistant', text: parsed.answer || raw, createdAt: new Date() };
        t.messages.push({ role: 'user', text: message, createdAt: new Date() });
        t.messages.push(assistantMessage);
        t.sentiment = sentiment;
        t.escalated = !!parsed.escalation;
        if(parsed.priority) t.priority = parsed.priority;
        await t.save();
      }
    }

    res.send({ ok: true, answer: parsed.answer || raw, empathy: parsed.empathy, escalation: !!parsed.escalation, priority: parsed.priority || 'normal', sourceDocs: docs, sentiment });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'server error', details: String(e) });
  }
});

export default router;
