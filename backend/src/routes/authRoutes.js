import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordOk = await user.comparePassword(password);

    if (!passwordOk) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, error: 'Full name, email, password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const accountNumber = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const user = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      passwordHash,
      role: 'customer',
      accountNumber,
      balance: 250000,
    });

    const token = signToken({ id: user._id.toString(), role: user.role });

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

export default router;
