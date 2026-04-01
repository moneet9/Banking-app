// managerAgent.js
// Manager Assistant: Analyzes transactions, employees, and fees for insights

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const db = require('../config/db');

async function managerAgentInsights() {
  await db();

  // Get today's date range
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  // Fetch today's transactions
  const transactions = await Transaction.find({
    createdAt: { $gte: start, $lte: end }
  });

  // Calculate total profit (sum of all fees)
  const totalProfit = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);

  // Group by employee
  const employeeStats = {};
  for (const tx of transactions) {
    if (!tx.employeeId) continue;
    if (!employeeStats[tx.employeeId]) {
      employeeStats[tx.employeeId] = { count: 0, total: 0 };
    }
    employeeStats[tx.employeeId].count += 1;
    employeeStats[tx.employeeId].total += tx.amount || 0;
  }

  // Find most active and best employee
  let mostActive = null, bestEmployee = null;
  for (const [empId, stats] of Object.entries(employeeStats)) {
    if (!mostActive || stats.count > mostActive.stats.count) {
      mostActive = { empId, stats };
    }
    if (!bestEmployee || stats.total > bestEmployee.stats.total) {
      bestEmployee = { empId, stats };
    }
  }

  // Get employee names
  const empIds = [mostActive?.empId, bestEmployee?.empId].filter(Boolean);
  const employees = await User.find({ _id: { $in: empIds } });
  const empMap = {};
  for (const emp of employees) empMap[emp._id] = emp.name;

  // Output insights
  console.log(`Total profit today: ₹${totalProfit}`);
  if (mostActive) {
    console.log(`Most active employee: ${empMap[mostActive.empId] || mostActive.empId} (${mostActive.stats.count} transactions)`);
  }
  if (bestEmployee) {
    console.log(`Top employee: ${empMap[bestEmployee.empId] || bestEmployee.empId} (₹${bestEmployee.stats.total} handled)`);
  }

  mongoose.connection.close();
}

managerAgentInsights();
