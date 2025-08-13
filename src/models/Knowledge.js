import mongoose from 'mongoose';

const KnowledgeSchema = new mongoose.Schema({
  title: String,
  content: String,
  source: String,
  metadata: Object,
  pineconeId: String
}, { timestamps: true });

export default mongoose.model('Knowledge', KnowledgeSchema);
