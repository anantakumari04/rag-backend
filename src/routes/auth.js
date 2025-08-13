import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if(!email || !password) return res.status(400).send({error: 'email+password required'});
    const exists = await User.findOne({ email });
    if(exists) return res.status(400).send({error: 'User exists'});
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash: hash });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
    res.send({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).send({ error: 'invalid' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(400).send({ error: 'invalid' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret');
    res.send({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'server error' });
  }
});

export default router;
