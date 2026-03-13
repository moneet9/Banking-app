import bcrypt from 'bcryptjs';
import env from './config/env.js';
import { connectDatabase } from './config/db.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Loan from './models/Loan.js';
import CashRequest from './models/CashRequest.js';
import LoanRate from './models/LoanRate.js';
import { DEFAULT_LOAN_RATES } from './utils/loanRates.js';

const DAY = 1000 * 60 * 60 * 24;

function atDaysAgo(days, hour, minute = 0) {
  const date = new Date(Date.now() - DAY * days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function monthlyPayment(principal, annualRatePercent, tenureMonths) {
  return principal * (annualRatePercent / 100 / 12) + principal / tenureMonths;
}

const SEED_USERS = [
  {
    fullName: 'Rahul Kumar',
    email: 'rahul.kumar@email.com',
    password: 'Password@123',
    role: 'customer',
    phone: '+91 98765 43210',
    accountNumber: '452145214521',
    balance: 2548175.5,
    memberSince: new Date('2023-01-15T00:00:00.000Z'),
  },
  {
    fullName: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'Password@123',
    role: 'customer',
    phone: '+91 99887 77665',
    accountNumber: '993200114422',
    balance: 742560.35,
    memberSince: new Date('2023-07-10T00:00:00.000Z'),
  },
  {
    fullName: 'Arjun Patel',
    email: 'arjun@example.com',
    password: 'Password@123',
    role: 'customer',
    phone: '+91 90909 90909',
    accountNumber: '331100558822',
    balance: 132340.2,
    memberSince: new Date('2024-03-05T00:00:00.000Z'),
  },
  {
    fullName: 'Sanya Verma',
    email: 'staff@securebank.com',
    password: 'Password@123',
    role: 'staff',
    phone: '+91 90000 11111',
    accountNumber: '771155339900',
    balance: 0,
    memberSince: new Date('2022-11-21T00:00:00.000Z'),
  },
  {
    fullName: 'Nikhil Mehta',
    email: 'manager@securebank.com',
    password: 'Password@123',
    role: 'manager',
    phone: '+91 92222 33333',
    accountNumber: '880044771122',
    balance: 0,
    memberSince: new Date('2021-09-14T00:00:00.000Z'),
  },
];

function transactionsForRahul(rahul) {
  return [
    {
      userId: rahul._id,
      name: 'Salary Deposit',
      amount: 85000,
      type: 'credit',
      category: 'Income',
      note: 'Monthly salary',
      timestamp: atDaysAgo(1, 9, 0),
    },
    {
      userId: rahul._id,
      name: 'Freelance Payment',
      amount: 25000,
      type: 'credit',
      category: 'Income',
      note: 'UI redesign project',
      timestamp: atDaysAgo(5, 14, 20),
    },
    {
      userId: rahul._id,
      name: 'UPI from Amit',
      amount: 3500,
      type: 'credit',
      category: 'Transfer',
      note: 'Dinner split',
      timestamp: atDaysAgo(12, 20, 10),
    },
    {
      userId: rahul._id,
      name: 'Netflix Subscription',
      amount: 399,
      type: 'debit',
      category: 'Entertainment',
      timestamp: atDaysAgo(0, 20, 30),
    },
    {
      userId: rahul._id,
      name: 'Starbucks',
      amount: 450,
      type: 'debit',
      category: 'Food & Drink',
      timestamp: atDaysAgo(2, 10, 15),
    },
    {
      userId: rahul._id,
      name: 'Amazon Purchase',
      amount: 1899.5,
      type: 'debit',
      category: 'Shopping',
      timestamp: atDaysAgo(3, 16, 40),
    },
    {
      userId: rahul._id,
      name: 'Transfer to Priya',
      amount: 5000,
      type: 'debit',
      category: 'Transfer',
      recipient: 'priya@example.com',
      note: 'Rent contribution',
      timestamp: atDaysAgo(4, 11, 30),
    },
    {
      userId: rahul._id,
      name: 'Ola Ride',
      amount: 450.5,
      type: 'debit',
      category: 'Transport',
      timestamp: atDaysAgo(6, 19, 5),
    },
    {
      userId: rahul._id,
      name: 'Electric Bill',
      amount: 2500,
      type: 'debit',
      category: 'Utilities',
      timestamp: atDaysAgo(8, 15, 45),
    },
    {
      userId: rahul._id,
      name: 'Gym Membership',
      amount: 1500,
      type: 'debit',
      category: 'Health',
      timestamp: atDaysAgo(11, 8, 30),
    },
    {
      userId: rahul._id,
      name: 'Mutual Fund SIP',
      amount: 10000,
      type: 'debit',
      category: 'Investment',
      timestamp: atDaysAgo(15, 9, 0),
    },
    {
      userId: rahul._id,
      name: 'ATM Cash Withdrawal',
      amount: 3000,
      type: 'debit',
      category: 'Cash',
      timestamp: atDaysAgo(18, 18, 10),
    },
  ];
}

function transactionsForPriya(priya) {
  return [
    {
      userId: priya._id,
      name: 'Salary Deposit',
      amount: 92000,
      type: 'credit',
      category: 'Income',
      timestamp: atDaysAgo(2, 9, 15),
    },
    {
      userId: priya._id,
      name: 'Transfer from Rahul',
      amount: 5000,
      type: 'credit',
      category: 'Transfer',
      note: 'Rent contribution',
      timestamp: atDaysAgo(4, 11, 35),
    },
    {
      userId: priya._id,
      name: 'Swiggy Order',
      amount: 780,
      type: 'debit',
      category: 'Food & Drink',
      timestamp: atDaysAgo(1, 21, 10),
    },
    {
      userId: priya._id,
      name: 'Internet Bill',
      amount: 1199,
      type: 'debit',
      category: 'Utilities',
      timestamp: atDaysAgo(9, 17, 0),
    },
  ];
}

function transactionsForArjun(arjun) {
  return [
    {
      userId: arjun._id,
      name: 'Client Payment',
      amount: 18000,
      type: 'credit',
      category: 'Income',
      timestamp: atDaysAgo(3, 13, 0),
    },
    {
      userId: arjun._id,
      name: 'Mobile Recharge',
      amount: 699,
      type: 'debit',
      category: 'Utilities',
      timestamp: atDaysAgo(6, 12, 30),
    },
  ];
}

function loansForRahul(rahul) {
  return [
    {
      userId: rahul._id,
      loanType: 'personal',
      amount: 200000,
      tenureMonths: 24,
      interestRate: 8.5,
      monthlyPayment: monthlyPayment(200000, 8.5, 24),
      status: 'approved',
      createdAt: atDaysAgo(70, 10, 0),
      updatedAt: atDaysAgo(65, 16, 20),
    },
    {
      userId: rahul._id,
      loanType: 'auto',
      amount: 450000,
      tenureMonths: 48,
      interestRate: 7.2,
      monthlyPayment: monthlyPayment(450000, 7.2, 48),
      status: 'pending',
      createdAt: atDaysAgo(3, 12, 10),
      updatedAt: atDaysAgo(1, 15, 0),
    },
    {
      userId: rahul._id,
      loanType: 'business',
      amount: 900000,
      tenureMonths: 60,
      interestRate: 9.5,
      monthlyPayment: monthlyPayment(900000, 9.5, 60),
      status: 'rejected',
      createdAt: atDaysAgo(120, 11, 35),
      updatedAt: atDaysAgo(118, 13, 45),
    },
  ];
}

async function seed() {
  await connectDatabase(env.mongodbUri);

  const seedEmails = SEED_USERS.map((item) => item.email);
  const existingUsers = await User.find({ email: { $in: seedEmails } }).select('_id');
  const existingUserIds = existingUsers.map((item) => item._id);

  if (existingUserIds.length > 0) {
    await Transaction.deleteMany({ userId: { $in: existingUserIds } });
    await Loan.deleteMany({ userId: { $in: existingUserIds } });
    await CashRequest.deleteMany({ userId: { $in: existingUserIds } });
    await User.deleteMany({ _id: { $in: existingUserIds } });
  }

  await LoanRate.deleteMany({});
  await LoanRate.insertMany(
    Object.entries(DEFAULT_LOAN_RATES).map(([loanType, rate]) => ({
      loanType,
      rate,
    }))
  );

  const createdUsers = [];
  for (const user of SEED_USERS) {
    const created = await User.create({
      fullName: user.fullName,
      email: user.email,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
      phone: user.phone,
      accountNumber: user.accountNumber,
      balance: user.balance,
      memberSince: user.memberSince,
    });
    createdUsers.push(created);
  }

  const rahul = createdUsers.find((item) => item.email === 'rahul.kumar@email.com');
  const priya = createdUsers.find((item) => item.email === 'priya@example.com');
  const arjun = createdUsers.find((item) => item.email === 'arjun@example.com');

  const transactions = [
    ...transactionsForRahul(rahul),
    ...transactionsForPriya(priya),
    ...transactionsForArjun(arjun),
  ];

  await Transaction.insertMany(transactions);
  await Loan.insertMany(loansForRahul(rahul));

  console.log('Seed complete');
  console.log(`Users: ${createdUsers.length}`);
  console.log(`Transactions: ${transactions.length}`);
  console.log('Loans: 3 (pending, approved, rejected)');
  console.log('Loan rates: personal, home, auto, business');
  console.log('Login with: rahul.kumar@email.com / Password@123');
  console.log('Staff login: staff@securebank.com / Password@123');
  console.log('Manager login: manager@securebank.com / Password@123');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
