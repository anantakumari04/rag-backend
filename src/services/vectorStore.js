import { Pinecone } from '@pinecone-database/pinecone';
import Knowledge from '../models/Knowledge.js';
import { v4 as uuidv4 } from 'uuid';

let pineconeClient = null;
let pineconeIndex = null;
let inMemory = []; // fallback [{ id, values, metadata }]

export async function initVectorStore() {
  const key = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || 'customer-support-kb';
  if (key) {
    const pinecone = new Pinecone({ apiKey: key });
    // Note: some SDK versions require init(); pattern varies. We use the Pinecone constructor above.
    pineconeClient = pinecone;
    try {
      pineconeIndex = pinecone.index(indexName);
      console.log('Pinecone index set:', indexName);
    } catch (e) {
      console.warn('Could not set Pinecone index (it may not exist yet):', e.message || e);
    }
  } else {
    console.log('No Pinecone API key found. Using in-memory vector store (demo only).');
  }
}

export async function upsertDocumentToVectorStore({ title, content, metadata = {}, embedding }) {
  const id = uuidv4();
  const pineMeta = { title, ...metadata };
  // Save metadata to Mongo first (optional)
  const k = await Knowledge.create({ title, content, metadata, pineconeId: id });
  if (pineconeClient && pineconeIndex) {
    const vectors = [{
      id,
      values: embedding,
      metadata: { title, mongoId: k._id.toString(), ...metadata }
    }];
    try {
      await pineconeIndex.upsert({ upsertRequest: { vectors } });
      return k;
    } catch (e) {
      console.warn('Pinecone upsert failed, falling back to in-memory:', e.message || e);
      inMemory.push({ id, values: embedding, metadata: { title, mongoId: k._id.toString(), ...metadata }});
      return k;
    }
  } else {
    inMemory.push({ id, values: embedding, metadata: { title, mongoId: k._id.toString(), ...metadata }});
    return k;
  }
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i=0;i<a.length;i++){ dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb) + 1e-10);
}

export async function queryTopK(embedding, topK=3) {
  if (pineconeClient && pineconeIndex) {
    try {
      const q = await pineconeIndex.query({ queryRequest: { vector: embedding, topK, includeMetadata: true, includeValues: false }});
      // response shape may vary by SDK version
      const matches = q.matches || q.results?.[0]?.matches || [];
      const mapped = matches.map(m => ({score: m.score, metadata: m.metadata}));
      // retrieve content from Mongo for each match
      const docs = [];
      for (const m of mapped) {
        const mongoId = m.metadata?.mongoId;
        if (mongoId) {
          const doc = await Knowledge.findById(mongoId);
          if (doc) docs.push({ title: doc.title, content: doc.content, score: m.score });
        }
      }
      return docs;
    } catch (e) {
      console.warn('Pinecone query failed, falling back to in-memory:', e.message || e);
    }
  }
  // in-memory fallback: compute cosine similarity
  const sims = inMemory.map(item => ({ id: item.id, score: cosineSim(embedding, item.values), metadata: item.metadata }));
  sims.sort((a,b)=>b.score-a.score);
  const top = sims.slice(0, topK);
  const docs = [];
  for (const t of top) {
    const doc = await Knowledge.findById(t.metadata.mongoId);
    if (doc) docs.push({ title: doc.title, content: doc.content, score: t.score });
  }
  return docs;
}
