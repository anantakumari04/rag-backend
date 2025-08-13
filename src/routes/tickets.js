import express from 'express';
import Ticket from '../models/Ticket.js';
const router = express.Router();

// Create ticket
router.post('/', async (req, res) => {
  try {
    const t = await Ticket.create(req.body);
    res.send(t);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'server error' });
  }
});

// Get tickets
router.get('/', async (req, res) => {
  try {
    const list = await Ticket.find().sort({ createdAt: -1 }).limit(100);
    res.send(list);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'server error' });
  }
});

export default router;
