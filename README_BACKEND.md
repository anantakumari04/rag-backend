# Backend - Customer Support RAG (Node/Express)

## Features
- Ingest knowledge base documents (stores metadata in MongoDB and vectors in Pinecone or in-memory fallback)
- Create/Update tickets
- RAG endpoint `/api/rag/respond` that:
  1. embeds the user message (OpenAI)
  2. queries vector DB for relevant KB articles
  3. asks OpenAI to produce an empathetic answer + classify escalation & priority
  4. stores assistant reply in a ticket (if ticketId provided)

## Env variables
See `.env.example` provided.

## Run
1. `cd backend`
2. `npm install`
3. copy `.env.example` -> `.env` and fill keys
4. `npm run dev`
