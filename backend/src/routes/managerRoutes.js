import express from 'express';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createActivityLog } from '../utils/activityLogger.js';
import { buildPassbookEntriesFromTransactions, transactionMatchesQuery } from '../utils/passbook.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('manager'));

function monthRange(monthOffsetFromCurrent) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffsetFromCurrent, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffsetFromCurrent + 1, 1);
  return { start, end };
}

function monthLabel(date) {
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

function percentChange(current, previous) {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalizeLimit(limit, defaultLimit = 200) {
  return Math.min(Math.max(Number(limit) || defaultLimit, 1), 500);
}

function customerProjection(user) {
  return {
    id: user._id.toString(),
    accountNumber: user.accountNumber,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    balance: user.balance,
    memberSince: user.memberSince,
  };
}

function staffProjection(user) {
  return {
    id: user._id.toString(),
    accountNumber: user.accountNumber,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    memberSince: user.memberSince,
    role: user.role,
  };
}

router.get('/dashboard', async (req, res) => {
  const [customerCount, totalLoans, approvedLoans, rejectedLoans, allTransactions] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Loan.countDocuments({}),
    Loan.countDocuments({ status: 'approved' }),
    Loan.countDocuments({ status: 'rejected' }),
    Transaction.find({}).select('amount type timestamp').lean(),
  ]);

  const totalRevenue = allTransactions
    .filter((item) => item.type === 'credit')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = allTransactions
    .filter((item) => item.type === 'debit')
    .reduce((sum, item) => sum + item.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const ranges = [-5, -4, -3, -2, -1, 0].map((offset) => {
    const range = monthRange(offset);
    return {
      ...range,
      month: monthLabel(range.start),
    };
  });

  const financialData = ranges.map((range) => {
    const monthTransactions = allTransactions.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= range.start.getTime() && timestamp < range.end.getTime();
    });

    const revenue = monthTransactions
      .filter((item) => item.type === 'credit')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenses = monthTransactions
      .filter((item) => item.type === 'debit')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      month: range.month,
      revenue: round2(revenue),
      expenses: round2(expenses),
      profit: round2(revenue - expenses),
    };
  });

  const loanPerformance = await Promise.all(
    ranges.map(async (range) => {
      const [disbursed, repaid, defaulted] = await Promise.all([
        Loan.countDocuments({ createdAt: { $gte: range.start, $lt: range.end } }),
        Loan.countDocuments({ status: 'approved', createdAt: { $gte: range.start, $lt: range.end } }),
        Loan.countDocuments({ status: 'rejected', createdAt: { $gte: range.start, $lt: range.end } }),
      ]);

      return {
        month: range.month,
        disbursed,
        repaid,
        defaulted,
      };
    })
  );

  const customerGrowth = await Promise.all(
    ranges.map(async (range) => {
      const customers = await User.countDocuments({
        role: 'customer',
        memberSince: { $lt: range.end },
      });

      return {
        month: range.month,
        customers,
      };
    })
  );

  const currentFinancial = financialData[financialData.length - 1] || { revenue: 0, profit: 0 };
  const previousFinancial = financialData[financialData.length - 2] || { revenue: 0, profit: 0 };
  const currentCustomers = customerGrowth[customerGrowth.length - 1]?.customers || 0;
  const previousCustomers = customerGrowth[customerGrowth.length - 2]?.customers || 0;
  const currentLoanPerf = loanPerformance[loanPerformance.length - 1] || { disbursed: 0, defaulted: 0 };
  const previousLoanPerf = loanPerformance[loanPerformance.length - 2] || { disbursed: 0, defaulted: 0 };

  const defaultRate = totalLoans > 0 ? (rejectedLoans / totalLoans) * 100 : 0;
  const currentDefaultRate = currentLoanPerf.disbursed > 0 ? (currentLoanPerf.defaulted / currentLoanPerf.disbursed) * 100 : 0;
  const previousDefaultRate = previousLoanPerf.disbursed > 0 ? (previousLoanPerf.defaulted / previousLoanPerf.disbursed) * 100 : 0;

  const kpis = {
    totalRevenue: round2(totalRevenue),
    totalRevenueChange: round2(percentChange(currentFinancial.revenue, previousFinancial.revenue)),
    netProfit: round2(netProfit),
    netProfitChange: round2(percentChange(currentFinancial.profit, previousFinancial.profit)),
    totalCustomers: customerCount,
    totalCustomersChange: round2(percentChange(currentCustomers, previousCustomers)),
    defaultRate: round2(defaultRate),
    defaultRateChange: round2(currentDefaultRate - previousDefaultRate),
  };

  return res.json({
    success: true,
    data: {
      role: req.user.role,
      customerCount,
      totalLoans,
      approvedLoans,
      rejectedLoans,
      kpis,
      financialData,
      loanPerformance,
      customerGrowth,
      message: 'Manager dashboard access granted',
    },
  });
});

router.get('/customers', async (req, res) => {
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
  return res.json({ success: true, data: users.map((user) => customerProjection(user)) });
});

router.get('/staff-members', async (req, res) => {
  const { q = '' } = req.query;

  const query = {
    role: 'staff',
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
  return res.json({ success: true, data: users.map((user) => staffProjection(user)) });
});

router.get('/passbook/:userId', async (req, res) => {
  const { userId } = req.params;
  const { q = '', limit = 300 } = req.query;
  const normalizedLimit = normalizeLimit(limit, 300);

  const customer = await User.findOne({ _id: userId, role: 'customer' });
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer account not found' });
  }

  const transactions = await Transaction.find({ userId: customer._id })
    .sort({ timestamp: -1 })
    .limit(normalizedLimit)
    .lean();

  const entries = buildPassbookEntriesFromTransactions(transactions, customer.balance)
    .filter((entry) => transactionMatchesQuery(entry, q));

  await createActivityLog({
    actorUserId: req.user._id,
    actorRole: req.user.role,
    action: 'MANAGER_PASSBOOK_VIEW',
    description: `${req.user.fullName} viewed passbook of ${customer.fullName}`,
    targetUserId: customer._id,
    targetRole: customer.role,
    metadata: {
      customerAccountNumber: customer.accountNumber,
      searchQuery: String(q || ''),
      returnedEntryCount: entries.length,
    },
  });

  return res.json({
    success: true,
    data: {
      customer: customer.toSafeObject(),
      balance: customer.balance,
      entries,
    },
  });
});

router.get('/passbook-logs', async (req, res) => {
  const { q = '', customerId = '', limit = 300 } = req.query;
  const normalizedLimit = normalizeLimit(limit, 300);
  const normalizedQuery = String(q || '').trim();

  const transactionQuery = {
    ...(customerId ? { userId: customerId } : {}),
  };

  if (normalizedQuery) {
    const regexSearch = { $regex: normalizedQuery, $options: 'i' };
    const matchedCustomers = await User.find({
      role: 'customer',
      $or: [
        { fullName: regexSearch },
        { email: regexSearch },
        { accountNumber: regexSearch },
      ],
    })
      .select('_id')
      .lean();

    const matchedCustomerIds = matchedCustomers.map((item) => item._id);
    transactionQuery.$or = [
      { name: regexSearch },
      { category: regexSearch },
      { note: regexSearch },
      { recipient: regexSearch },
      ...(matchedCustomerIds.length ? [{ userId: { $in: matchedCustomerIds } }] : []),
    ];
  }

  const rows = await Transaction.find(transactionQuery)
    .sort({ timestamp: -1 })
    .limit(normalizedLimit)
    .populate('userId', 'fullName email accountNumber role')
    .lean();

  const data = rows
    .filter((item) => item.userId && typeof item.userId === 'object' && item.userId.role === 'customer')
    .map((item) => ({
      id: item._id.toString(),
      timestamp: item.timestamp,
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      note: item.note || '',
      recipient: item.recipient || '',
      customer: {
        id: item.userId._id.toString(),
        fullName: item.userId.fullName,
        email: item.userId.email,
        accountNumber: item.userId.accountNumber,
      },
    }));

  return res.json({ success: true, data });
});

router.get('/staff-activity-logs', async (req, res) => {
  const { q = '', staffId = '', action = '', limit = 300 } = req.query;
  const normalizedLimit = normalizeLimit(limit, 300);
  const normalizedQuery = String(q || '').trim();

  const logQuery = {
    actorRole: 'staff',
    ...(staffId ? { actorUserId: staffId } : {}),
    ...(action ? { action } : {}),
  };

  if (normalizedQuery) {
    const regexSearch = { $regex: normalizedQuery, $options: 'i' };
    const [matchedStaff, matchedCustomers] = await Promise.all([
      User.find({
        role: 'staff',
        $or: [{ fullName: regexSearch }, { email: regexSearch }, { accountNumber: regexSearch }],
      })
        .select('_id')
        .lean(),
      User.find({
        role: 'customer',
        $or: [{ fullName: regexSearch }, { email: regexSearch }, { accountNumber: regexSearch }],
      })
        .select('_id')
        .lean(),
    ]);

    const matchedStaffIds = matchedStaff.map((item) => item._id);
    const matchedCustomerIds = matchedCustomers.map((item) => item._id);

    logQuery.$or = [
      { description: regexSearch },
      { action: regexSearch },
      ...(matchedStaffIds.length ? [{ actorUserId: { $in: matchedStaffIds } }] : []),
      ...(matchedCustomerIds.length ? [{ targetUserId: { $in: matchedCustomerIds } }] : []),
    ];
  }

  const rows = await ActivityLog.find(logQuery)
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
    .populate('actorUserId', 'fullName email role accountNumber')
    .populate('targetUserId', 'fullName email role accountNumber')
    .lean();

  const data = rows.map((item) => ({
    id: item._id.toString(),
    action: item.action,
    description: item.description,
    createdAt: item.createdAt,
    metadata: item.metadata || {},
    actor: item.actorUserId
      ? {
          id: item.actorUserId._id.toString(),
          fullName: item.actorUserId.fullName,
          email: item.actorUserId.email,
          role: item.actorUserId.role,
          accountNumber: item.actorUserId.accountNumber,
        }
      : null,
    target: item.targetUserId
      ? {
          id: item.targetUserId._id.toString(),
          fullName: item.targetUserId.fullName,
          email: item.targetUserId.email,
          role: item.targetUserId.role,
          accountNumber: item.targetUserId.accountNumber,
        }
      : null,
  }));

  return res.json({ success: true, data });
});

export default router;
