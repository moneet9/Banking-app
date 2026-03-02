import express from 'express';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import CashRequest from '../models/CashRequest.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('staff', 'manager'));

router.get('/accounts', async (req, res) => {
  const { q = '' } = req.query;

  const query = {
    role: 'customer',
    ...(q
      ? {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { accountNumber: { $regex: q, $options: 'i' } },
          ],
        }
      : {}),
  };

  const users = await User.find(query).sort({ createdAt: -1 }).lean();

  const items = users.map((user) => ({
    id: user._id.toString(),
    accountNumber: user.accountNumber,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    balance: user.balance,
    memberSince: user.memberSince,
  }));

  return res.json({ success: true, data: items });
});

router.post('/accounts/:userId/deposit', async (req, res) => {
  const { userId } = req.params;
  const { amount, note } = req.body;
  const numericAmount = Number(amount);

  if (!userId || Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid customer and amount are required' });
  }

  const customer = await User.findOne({ _id: userId, role: 'customer' });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer account not found' });
  }

  customer.balance += numericAmount;
  await customer.save();

  const transaction = await Transaction.create({
    userId: customer._id,
    name: 'Cash Deposit by Staff',
    amount: numericAmount,
    type: 'credit',
    category: 'Deposit',
    note: note || `Staff ${req.user.fullName} deposited funds`,
  });

  return res.status(201).json({
    success: true,
    data: {
      transaction,
      balance: customer.balance,
      customerId: customer._id.toString(),
    },
    message: 'Deposit completed successfully',
  });
});

router.post('/accounts/:userId/withdraw', async (req, res) => {
  const { userId } = req.params;
  const { amount, note } = req.body;
  const numericAmount = Number(amount);

  if (!userId || Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid customer and amount are required' });
  }

  const customer = await User.findOne({ _id: userId, role: 'customer' });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer account not found' });
  }

  if (customer.balance < numericAmount) {
    return res.status(400).json({ success: false, error: 'Insufficient balance' });
  }

  customer.balance -= numericAmount;
  await customer.save();

  const transaction = await Transaction.create({
    userId: customer._id,
    name: 'Cash Withdrawal by Staff',
    amount: numericAmount,
    type: 'debit',
    category: 'Withdrawal',
    note: note || `Staff ${req.user.fullName} processed withdrawal`,
  });

  return res.status(201).json({
    success: true,
    data: {
      transaction,
      balance: customer.balance,
      customerId: customer._id.toString(),
    },
    message: 'Withdrawal completed successfully',
  });
});

router.get('/requests', async (req, res) => {
  const { status = 'pending' } = req.query;

  const items = await CashRequest.find(
    status && ['pending', 'approved', 'rejected'].includes(status)
      ? { status }
      : {}
  )
    .populate('userId', 'fullName email accountNumber')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: items });
});

router.post('/requests/:requestId/approve', async (req, res) => {
  const { requestId } = req.params;
  const { note } = req.body;

  const cashRequest = await CashRequest.findById(requestId);
  if (!cashRequest) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  if (cashRequest.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Request already processed' });
  }

  const customer = await User.findOne({ _id: cashRequest.userId, role: 'customer' });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer account not found' });
  }

  if (cashRequest.type === 'withdrawal' && customer.balance < cashRequest.amount) {
    return res.status(400).json({ success: false, error: 'Insufficient balance for withdrawal approval' });
  }

  if (cashRequest.type === 'deposit') {
    customer.balance += cashRequest.amount;
  } else {
    customer.balance -= cashRequest.amount;
  }

  await customer.save();

  await Transaction.create({
    userId: customer._id,
    name: cashRequest.type === 'deposit' ? 'Deposit via Staff Approval' : 'Withdrawal via Staff Approval',
    amount: cashRequest.amount,
    type: cashRequest.type === 'deposit' ? 'credit' : 'debit',
    category: cashRequest.type === 'deposit' ? 'Deposit' : 'Withdrawal',
    note: note || cashRequest.note || `Processed by ${req.user.fullName}`,
  });

  cashRequest.status = 'approved';
  cashRequest.processedBy = req.user._id;
  cashRequest.processedAt = new Date();
  if (note) {
    cashRequest.note = note;
  }
  await cashRequest.save();

  return res.json({
    success: true,
    data: {
      requestId: cashRequest._id.toString(),
      status: cashRequest.status,
      balance: customer.balance,
    },
    message: 'Request approved successfully',
  });
});

router.post('/requests/:requestId/reject', async (req, res) => {
  const { requestId } = req.params;
  const { note } = req.body;

  const cashRequest = await CashRequest.findById(requestId);
  if (!cashRequest) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }

  if (cashRequest.status !== 'pending') {
    return res.status(400).json({ success: false, error: 'Request already processed' });
  }

  cashRequest.status = 'rejected';
  cashRequest.processedBy = req.user._id;
  cashRequest.processedAt = new Date();
  if (note) {
    cashRequest.note = note;
  }
  await cashRequest.save();

  return res.json({
    success: true,
    data: {
      requestId: cashRequest._id.toString(),
      status: cashRequest.status,
    },
    message: 'Request rejected',
  });
});

router.get('/dashboard', async (req, res) => {
  const [customerCount, pendingLoans] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Loan.countDocuments({ status: 'pending' }),
  ]);

  return res.json({
    success: true,
    data: {
      role: req.user.role,
      customerCount,
      pendingLoans,
      message: 'Staff dashboard access granted',
    },
  });
});

export default router;
