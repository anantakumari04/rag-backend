import express from 'express';
import { embedText } from '../services/ai.js';
import { initVectorStore, upsertDocumentToVectorStore } from '../services/vectorStore.js';

const router = express.Router();

router.post('/ingest', async (req, res) => {
  try {
    await initVectorStore();
    const { title, content, metadata } = req.body;
    if(!content || !title) return res.status(400).send({ error: 'title+content required' });
    const embedding = await embedText(content);
    const saved = await upsertDocumentToVectorStore({ title, content, metadata, embedding });
    res.send({ ok: true, saved });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'server error' });
  }
});

export default router;
