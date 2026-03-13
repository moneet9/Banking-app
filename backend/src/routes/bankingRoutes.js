import express from 'express';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import CashRequest from '../models/CashRequest.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { buildPassbookEntriesFromTransactions, transactionMatchesQuery } from '../utils/passbook.js';
import { getLoanRatesMap, loanRateMapToList } from '../utils/loanRates.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('customer'));

router.get('/me', async (req, res) => {
  return res.json({ success: true, data: req.user.toSafeObject() });
});

router.get('/dashboard', async (req, res) => {
  const [recentTransactions, monthTransactions] = await Promise.all([
    Transaction.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(5).lean(),
    Transaction.find({
      userId: req.user._id,
      timestamp: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    }).lean(),
  ]);

  const thisMonthCredit = monthTransactions
    .filter((item) => item.type === 'credit')
    .reduce((sum, item) => sum + item.amount, 0);

  const thisMonthDebit = monthTransactions
    .filter((item) => item.type === 'debit')
    .reduce((sum, item) => sum + item.amount, 0);

  return res.json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
      balance: req.user.balance,
      thisMonthNet: thisMonthCredit - thisMonthDebit,
      recentTransactions,
    },
  });
});

router.get('/transactions', async (req, res) => {
  const { q = '', limit = 100 } = req.query;
  const query = {
    userId: req.user._id,
    ...(q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
            { recipient: { $regex: q, $options: 'i' } },
          ],
        }
      : {}),
  };

  const items = await Transaction.find(query)
    .sort({ timestamp: -1 })
    .limit(Number(limit) || 100)
    .lean();

  return res.json({ success: true, data: items });
});

router.get('/passbook', async (req, res) => {
  const { q = '', limit = 200 } = req.query;
  const normalizedLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);

  const transactions = await Transaction.find({ userId: req.user._id })
    .sort({ timestamp: -1 })
    .limit(normalizedLimit)
    .lean();

  const entries = buildPassbookEntriesFromTransactions(transactions, req.user.balance)
    .filter((transaction) => transactionMatchesQuery(transaction, q));

  return res.json({
    success: true,
    data: {
      customer: req.user.toSafeObject(),
      balance: req.user.balance,
      entries,
    },
  });
});

router.get('/loan-rates', async (req, res) => {
  const rateMap = await getLoanRatesMap();
  return res.json({
    success: true,
    data: loanRateMapToList(rateMap),
  });
});

router.post('/transfers', async (req, res) => {
  const { recipient, amount, note } = req.body;
  const numericAmount = Number(amount);

  if (!recipient || Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Recipient and valid amount are required' });
  }

  if (req.user.balance < numericAmount) {
    return res.status(400).json({ success: false, error: 'Insufficient balance' });
  }

  req.user.balance -= numericAmount;
  await req.user.save();

  const transferTxn = await Transaction.create({
    userId: req.user._id,
    name: `Transfer to ${recipient}`,
    amount: numericAmount,
    type: 'debit',
    category: 'Transfer',
    note: note || '',
    recipient,
  });

  return res.status(201).json({
    success: true,
    data: {
      transaction: transferTxn,
      balance: req.user.balance,
    },
    message: 'Transfer completed successfully',
  });
});

router.post('/loans', async (req, res) => {
  const { loanType, amount, tenureMonths } = req.body;
  const principal = Number(amount);
  const tenure = Number(tenureMonths);
  const loanRates = await getLoanRatesMap();

  if (!loanType || !loanRates[loanType] || Number.isNaN(principal) || principal <= 0 || Number.isNaN(tenure) || tenure <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid loan payload' });
  }

  const interestRate = loanRates[loanType];
  const monthlyPayment = principal * (interestRate / 100 / 12) + principal / tenure;

  const loan = await Loan.create({
    userId: req.user._id,
    loanType,
    amount: principal,
    tenureMonths: tenure,
    interestRate,
    monthlyPayment,
  });

  return res.status(201).json({ success: true, data: loan, message: 'Loan application submitted successfully' });
});

router.get('/loans', async (req, res) => {
  const loans = await Loan.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: loans });
});

router.post('/cash-requests', async (req, res) => {
  const { type, amount, note } = req.body;
  const numericAmount = Number(amount);

  if (!type || !['deposit', 'withdrawal'].includes(type) || Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid cash request payload' });
  }

  const item = await CashRequest.create({
    userId: req.user._id,
    type,
    amount: numericAmount,
    note: note || '',
    status: 'pending',
  });

  return res.status(201).json({
    success: true,
    data: item,
    message: 'Request submitted to staff for approval',
  });
});

router.get('/cash-requests', async (req, res) => {
  const items = await CashRequest.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: items });
});

export default router;
