import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './src/routes/auth.js';
import kbRoutes from './src/routes/kb.js';
import ragRoutes from './src/routes/rag.js';
import ticketRoutes from './src/routes/tickets.js';

dotenv.config();


// console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rag';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error', err);
});

app.use('/api/auth', authRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => res.send({ ok: true, msg: 'Customer Support RAG backend' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
