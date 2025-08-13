import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  messages: [{ role: String, text: String, createdAt: Date }],
  status: { type: String, default: 'open' },
  priority: { type: String, default: 'normal' },
  sentiment: { type: String, default: 'neutral' },
  escalated: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Ticket', TicketSchema);
