import express from 'express';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

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

export default router;
