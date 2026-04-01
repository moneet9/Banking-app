import type { PassbookEntry, PassbookResponse } from '../services/bankingApi';

export interface SpendingCategoryInsight {
  category: string;
  amount: number;
}

export interface PeriodSummary {
  credits: number;
  debits: number;
  net: number;
  count: number;
}

export interface FinanceSnapshot {
  balance: number;
  entryCount: number;
  totalCredits: number;
  totalDebits: number;
  weeklyCredits: number;
  weeklyDebits: number;
  weeklyNet: number;
  monthlyCredits: number;
  monthlyDebits: number;
  monthlyNet: number;
  yearlyCredits: number;
  yearlyDebits: number;
  yearlyNet: number;
  topSpendingCategories: SpendingCategoryInsight[];
  spendingByCategory: SpendingCategoryInsight[];
  weeklySummary: PeriodSummary;
  monthlySummary: PeriodSummary;
  yearlySummary: PeriodSummary;
  recentEntries: PassbookEntry[];
  largestCredit: PassbookEntry | null;
  largestDebit: PassbookEntry | null;
  latestEntry: PassbookEntry | null;
}

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function normalizeAmount(value: unknown) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatMoney(value: number) {
  return moneyFormatter.format(normalizeAmount(value));
}

export function buildFinanceSnapshot(passbook: PassbookResponse | null): FinanceSnapshot {
  const entries = [...(passbook?.entries || [])]
    .map((entry) => ({
      ...entry,
      amount: normalizeAmount(entry.amount),
    }))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const credits = entries.filter((entry) => entry.type === 'credit');
  const debits = entries.filter((entry) => entry.type === 'debit');
  const weeklyEntries = entries.filter((entry) => new Date(entry.timestamp).getTime() >= weekStart.getTime());
  const monthlyEntries = entries.filter((entry) => new Date(entry.timestamp).getTime() >= monthStart.getTime());
  const yearlyEntries = entries.filter((entry) => new Date(entry.timestamp).getTime() >= yearStart.getTime());

  const totalCredits = credits.reduce((sum, entry) => sum + entry.amount, 0);
  const totalDebits = debits.reduce((sum, entry) => sum + entry.amount, 0);
  const weeklyCredits = weeklyEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
  const weeklyDebits = weeklyEntries.filter((entry) => entry.type === 'debit').reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyCredits = monthlyEntries
    .filter((entry) => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyDebits = monthlyEntries
    .filter((entry) => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);
  const yearlyCredits = yearlyEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
  const yearlyDebits = yearlyEntries.filter((entry) => entry.type === 'debit').reduce((sum, entry) => sum + entry.amount, 0);

  const categoryMap = new Map<string, number>();
  const allCategoryMap = new Map<string, number>();

  debits.forEach((entry) => {
    const category = entry.category?.trim() || 'Other';
    categoryMap.set(category, (categoryMap.get(category) || 0) + entry.amount);
  });

  entries.forEach((entry) => {
    const category = entry.category?.trim() || 'Other';
    const signedAmount = entry.type === 'credit' ? entry.amount : entry.amount;
    allCategoryMap.set(category, (allCategoryMap.get(category) || 0) + signedAmount);
  });

  const topSpendingCategories = [...categoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3);

  const spendingByCategory = [...categoryMap.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount);

  const largestCredit = credits.reduce<PassbookEntry | null>((largest, entry) => {
    if (!largest || entry.amount > largest.amount) {
      return entry;
    }
    return largest;
  }, null);

  const largestDebit = debits.reduce<PassbookEntry | null>((largest, entry) => {
    if (!largest || entry.amount > largest.amount) {
      return entry;
    }
    return largest;
  }, null);

  return {
    balance: normalizeAmount(passbook?.balance),
    entryCount: entries.length,
    totalCredits,
    totalDebits,
    weeklyCredits,
    weeklyDebits,
    weeklyNet: weeklyCredits - weeklyDebits,
    monthlyCredits,
    monthlyDebits,
    monthlyNet: monthlyCredits - monthlyDebits,
    yearlyCredits,
    yearlyDebits,
    yearlyNet: yearlyCredits - yearlyDebits,
    topSpendingCategories,
    spendingByCategory,
    weeklySummary: {
      credits: weeklyCredits,
      debits: weeklyDebits,
      net: weeklyCredits - weeklyDebits,
      count: weeklyEntries.length,
    },
    monthlySummary: {
      credits: monthlyCredits,
      debits: monthlyDebits,
      net: monthlyCredits - monthlyDebits,
      count: monthlyEntries.length,
    },
    yearlySummary: {
      credits: yearlyCredits,
      debits: yearlyDebits,
      net: yearlyCredits - yearlyDebits,
      count: yearlyEntries.length,
    },
    recentEntries: entries.slice(0, 5),
    largestCredit,
    largestDebit,
    latestEntry: entries[0] || null,
  };
}

function includesAny(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

function buildActionPlan(snapshot: FinanceSnapshot) {
  const topCategory = snapshot.topSpendingCategories[0];
  const largestDebit = snapshot.largestDebit;
  const balance = snapshot.balance;

  if (balance <= 0) {
    return [
      'Pause non-essential spending until your balance turns positive.',
      largestDebit ? `Review the ${formatMoney(largestDebit.amount)} debit from ${largestDebit.name}.` : 'Review your last few debits for anything you can delay.',
      'Move only essential payments first, then reassess transfers.',
    ];
  }

  if (snapshot.monthlyNet < 0) {
    return [
      `You are spending more than you earn this month by ${formatMoney(Math.abs(snapshot.monthlyNet))}.`,
      topCategory ? `Cut back on ${topCategory.category} first because it is your biggest spend area.` : 'Cut one non-essential category first.',
      `Keep at least ${formatMoney(Math.max(balance * 0.2, snapshot.monthlyDebits * 0.25))} as a buffer before any new transfer.`,
    ];
  }

  if (snapshot.monthlyDebits > snapshot.monthlyCredits && snapshot.monthlyCredits > 0) {
    return [
      'Your spending is still running ahead of your income this month.',
      topCategory ? `Set a weekly cap for ${topCategory.category}.` : 'Set a weekly spending cap for your largest variable expense.',
      'Avoid large transfers until the balance trend stays positive for a few days.',
    ];
  }

  return [
    `Your balance looks healthy at ${formatMoney(balance)}.`,
    `You can safely keep around ${formatMoney(Math.max(balance * 0.15, 0))} untouched as a reserve.`,
    topCategory ? `If you want to save more, reduce ${topCategory.category} first.` : 'If you want to save more, reduce one discretionary spend category.',
  ];
}

function isAdviceQuery(input: string) {
  return includesAny(input, ['what should i do', 'what do i do', 'what to do', 'help me', 'advice', 'suggest', 'recommend', 'next step']);
}

function isHealthQuery(input: string) {
  return includesAny(input, ['health', 'healthy', 'overall', 'status', 'safe', 'good finance', 'good financial', 'account health']);
}

function isManagerQuery(input: string) {
  return includesAny(input, ['manager', 'lead', 'run finances', 'manage finances', 'team', 'department', 'business', 'better lead']);
}

function formatPeriodSummary(label: string, summary: PeriodSummary) {
  return `${label}: ${formatMoney(summary.debits)} spent, ${formatMoney(summary.credits)} received, net ${summary.net >= 0 ? 'savings' : 'loss'} of ${formatMoney(Math.abs(summary.net))}`;
}

function buildCategoryInsights(snapshot: FinanceSnapshot) {
  const categories = snapshot.spendingByCategory.slice(0, 4);

  if (categories.length === 0) {
    return 'I do not see enough category data yet.';
  }

  return categories
    .map((entry) => `${entry.category} ${formatMoney(entry.amount)}`)
    .join(', ');
}

function buildHealthAdvice(snapshot: FinanceSnapshot) {
  const monthlyNet = snapshot.monthlyNet;
  const weeklyNet = snapshot.weeklyNet;
  const savingsCapacity = Math.max(snapshot.balance * 0.15, snapshot.monthlyCredits * 0.1);
  const topCategory = snapshot.topSpendingCategories[0];

  if (snapshot.entryCount === 0) {
    return 'Your account is healthy enough to use, but I need transaction history to give a stronger assessment.';
  }

  if (snapshot.balance <= 0 || monthlyNet < 0) {
    return [
      `Overall account health is weak because your monthly net is ${formatMoney(Math.abs(monthlyNet))} negative and your balance is ${formatMoney(snapshot.balance)}.`,
      topCategory ? `The biggest problem area is ${topCategory.category}.` : 'The biggest problem area is unclear, so review your last few debits.',
      'Reduce non-essential spending, protect cash for required payments, and avoid new transfers until the trend improves.',
    ].join(' ');
  }

  if (weeklyNet < 0) {
    return [
      `Your account is stable overall, but this week you are down by ${formatMoney(Math.abs(weeklyNet))}.`,
      `A safe savings target right now is about ${formatMoney(savingsCapacity)}.`,
      topCategory ? `Focus first on ${topCategory.category} to improve the next weekly cycle.` : 'Focus first on discretionary spending to improve the next weekly cycle.',
    ].join(' ');
  }

  return [
    `Overall account health looks good. Your balance is ${formatMoney(snapshot.balance)} and your monthly net is positive by ${formatMoney(monthlyNet)}.`,
    `You can probably save around ${formatMoney(savingsCapacity)} without creating stress.`,
    topCategory ? `Keep watching ${topCategory.category} so it does not grow faster than income.` : 'Keep watching discretionary spending so it does not grow faster than income.',
  ].join(' ');
}

function buildManagerAdvice(snapshot: FinanceSnapshot) {
  const topCategory = snapshot.topSpendingCategories[0];
  const weeklyStress = snapshot.weeklyNet < 0 ? 'The short-term cash flow is under pressure.' : 'The short-term cash flow is acceptable.';

  return [
    'If I were managing this account or team budget, I would start with cash flow discipline.',
    weeklyStress,
    topCategory ? `Set a cap on ${topCategory.category} because it is the clearest spending leak.` : 'Set category caps on the most variable expense buckets.',
    `Use a savings rule of keeping at least ${formatMoney(Math.max(snapshot.balance * 0.2, snapshot.monthlyDebits * 0.25))} untouched as reserve cash.`,
    'Review weekly spending instead of waiting for month-end so corrections happen earlier.',
  ].join(' ');
}

function buildDistributionReply(snapshot: FinanceSnapshot) {
  const topCategories = snapshot.spendingByCategory.slice(0, 5);

  if (topCategories.length === 0) {
    return 'I do not see enough spending data yet to build a distribution view.';
  }

  return [
    `Spending distribution this month: ${topCategories.map((item) => `${item.category} ${formatMoney(item.amount)}`).join(', ')}.`,
    `Weekly net is ${formatMoney(snapshot.weeklyNet)}, monthly net is ${formatMoney(snapshot.monthlyNet)}, and yearly net is ${formatMoney(snapshot.yearlyNet)}.`,
    'If you want, I can turn this into a food, entertainment, income, and investment breakdown next.',
  ].join(' ');
}

function buildTopicAdvice(input: string, snapshot: FinanceSnapshot) {
  const topCategory = snapshot.topSpendingCategories[0];
  const balanceBuffer = formatMoney(Math.max(snapshot.balance * 0.2, snapshot.monthlyDebits * 0.25));

  if (includesAny(input, ['food', 'grocery', 'meal', 'dining'])) {
    const food = snapshot.spendingByCategory.find((entry) =>
      entry.category.toLowerCase().includes('food') || entry.category.toLowerCase().includes('grocery') || entry.category.toLowerCase().includes('dining')
    );

    return food
      ? `Food spending is ${formatMoney(food.amount)}. Keep a weekly food cap, buy staples in bulk when possible, and reduce ordering-out if you want faster savings.`
      : 'I do not see a clear food category yet, so track grocery and dining expenses separately and set a weekly cap for both.';
  }

  if (includesAny(input, ['entertainment', 'movie', 'fun', 'travel', 'outing'])) {
    const entertainment = snapshot.spendingByCategory.find((entry) =>
      entry.category.toLowerCase().includes('entertainment') || entry.category.toLowerCase().includes('fun') || entry.category.toLowerCase().includes('travel')
    );

    return entertainment
      ? `Entertainment spending is ${formatMoney(entertainment.amount)}. Keep it flexible but capped, and move any leftover amount toward savings at the end of the week.`
      : 'I do not see a clear entertainment category yet, so create one budget bucket for fun and track it weekly.';
  }

  if (includesAny(input, ['investment', 'invest', 'sip', 'mutual fund', 'stocks'])) {
    return snapshot.monthlyNet >= 0
      ? `Your account can support investing better now because monthly net is positive by ${formatMoney(snapshot.monthlyNet)}. Keep ${balanceBuffer} as reserve first, then invest only the surplus.`
      : 'Do not increase investment outflow yet. Stabilize cash flow first, keep a reserve, and invest only after monthly net turns positive.';
  }

  if (includesAny(input, ['income', 'salary', 'credit', 'deposit'])) {
    return snapshot.monthlyCredits > 0
      ? `Income this month is ${formatMoney(snapshot.monthlyCredits)}. Try automating savings from each credit so a fixed part of income moves away before spending starts.`
      : 'I do not see regular income entries yet, so start by tracking credits and separating fixed income from irregular deposits.';
  }

  if (includesAny(input, ['transfer', 'send', 'pay', 'recipient'])) {
    return snapshot.balance > 0
      ? `You can transfer cautiously, but keep about ${balanceBuffer} untouched so bills and essentials stay covered.`
      : 'Avoid transfers for now because your balance is low. Protect essentials first and wait for a positive cash buffer.';
  }

  if (includesAny(input, ['week', 'weekly'])) {
    return `Weekly view: ${formatPeriodSummary('This week', snapshot.weeklySummary)}. Break the week into caps for food, travel, and entertainment, then review every Sunday.`;
  }

  if (includesAny(input, ['month', 'monthly'])) {
    return `Monthly view: ${formatPeriodSummary('This month', snapshot.monthlySummary)}. Your biggest category is ${topCategory ? topCategory.category : 'unclear'}, so that is the first place to reduce spending.`;
  }

  if (includesAny(input, ['year', 'yearly'])) {
    return `Yearly view: ${formatPeriodSummary('This year', snapshot.yearlySummary)}. Use the yearly trend to set a savings target and make sure spending is not growing faster than income.`;
  }

  return buildActionPlan(snapshot).join(' ');
}

export function buildAssistantGreeting(snapshot: FinanceSnapshot) {
  if (snapshot.entryCount === 0) {
    return `I connected to your passbook, but there is no transaction history yet. Your current balance is ${formatMoney(
      snapshot.balance
    )}. Ask me anything about transfers, budgets, or savings and I will help with the numbers.`;
  }

  const topCategory = snapshot.topSpendingCategories[0];
  const latestEntry = snapshot.latestEntry;
  const netDirection = snapshot.monthlyNet >= 0 ? 'up' : 'down';
  const netAmount = formatMoney(Math.abs(snapshot.monthlyNet));

  return [
    `I pulled your passbook context. Your balance is ${formatMoney(snapshot.balance)}.`,
    `This month you are ${netDirection} by ${netAmount}, with ${formatMoney(snapshot.monthlyDebits)} spent and ${formatMoney(
      snapshot.monthlyCredits
    )} received.`,
    topCategory ? `Your biggest spending category is ${topCategory.category} at ${formatMoney(topCategory.amount)}.` : '',
    latestEntry
      ? `Your latest transaction was ${latestEntry.name} for ${formatMoney(Math.abs(latestEntry.amount))}.`
      : '',
    'You can ask me about budgeting, spending trends, transfers, or what looks unusual in your passbook.',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildSuggestedPrompts(snapshot: FinanceSnapshot) {
  const prompts = [
    'Summarize my monthly spending',
    'Can I afford a transfer right now?',
    'Help me save more this month',
  ];

  if (snapshot.topSpendingCategories[0]) {
    prompts[0] = `What should I do about ${snapshot.topSpendingCategories[0].category}?`;
  }

  if (snapshot.largestDebit) {
    prompts[1] = `How do I manage the ${formatMoney(snapshot.largestDebit.amount)} debit?`;
  }

  if (snapshot.balance > 0) {
    prompts[2] = `How healthy is my account and how much should I keep aside from ${formatMoney(snapshot.balance)}?`;
  }

  return prompts;
}

export function generateAssistantReply(message: string, snapshot: FinanceSnapshot) {
  const input = message.toLowerCase().trim();

  if (!input) {
    return 'Tell me what you want to understand about your finances.';
  }

  const balanceText = formatMoney(snapshot.balance);
  const monthlyNetText = formatMoney(Math.abs(snapshot.monthlyNet));
  const topCategory = snapshot.topSpendingCategories[0];
  const largestDebit = snapshot.largestDebit;
  const latestEntry = snapshot.latestEntry;

  if (includesAny(input, ['distribution', 'breakdown', 'split', 'share', 'week', 'monthly', 'month', 'yearly', 'year', 'weeky'])) {
    return buildDistributionReply(snapshot);
  }

  if (includesAny(input, ['food', 'grocery', 'entertainment', 'investment', 'invest', 'income', 'salary'])) {
    const food = snapshot.spendingByCategory.find((entry) => entry.category.toLowerCase().includes('food') || entry.category.toLowerCase().includes('grocery'));
    const entertainment = snapshot.spendingByCategory.find((entry) => entry.category.toLowerCase().includes('entertainment') || entry.category.toLowerCase().includes('fun'));
    const investment = snapshot.topSpendingCategories.find((entry) => entry.category.toLowerCase().includes('investment') || entry.category.toLowerCase().includes('invest'));
    const incomeLine = snapshot.monthlyCredits > 0 ? `Monthly income is ${formatMoney(snapshot.monthlyCredits)}.` : 'I do not see regular income entries yet.';

    return [
      `Category view: ${food ? `food ${formatMoney(food.amount)}` : 'no clear food category'}, ${entertainment ? `entertainment ${formatMoney(entertainment.amount)}` : 'no clear entertainment category'}, ${investment ? `investment ${formatMoney(investment.amount)}` : 'no clear investment category'}.`,
      incomeLine,
      `Net savings this month are ${formatMoney(snapshot.monthlyNet)}.`,
      'To improve finances, keep food and entertainment within a fixed weekly cap and move any surplus toward savings or investments.',
    ].join(' ');
  }

  if (isHealthQuery(input)) {
    return buildHealthAdvice(snapshot);
  }

  if (isManagerQuery(input)) {
    return buildManagerAdvice(snapshot);
  }

  if (isAdviceQuery(input)) {
    const topicAdvice = buildTopicAdvice(input, snapshot);

    return [
      'Here is my advice:',
      topicAdvice,
      'If you want, I can also make this more specific for food, entertainment, income, investment, weekly spend, or yearly trend.',
    ].join(' ');
  }

  if (includesAny(input, ['balance', 'cash', 'fund', 'available', 'money'])) {
    return snapshot.monthlyNet >= 0
      ? `Your balance is ${balanceText}, and this month you are ahead by ${monthlyNetText}. ${
          latestEntry ? `Your latest transaction was ${latestEntry.name}.` : ''
        }`
      : `Your balance is ${balanceText}, and this month you are down by ${monthlyNetText}. ${
          topCategory ? `The largest spending area is ${topCategory.category}.` : ''
        }`;
  }

  if (includesAny(input, ['spend', 'expense', 'budget', 'budgeting', 'save', 'saving'])) {
    const biggestSpend = topCategory
      ? `Your biggest spending category is ${topCategory.category} at ${formatMoney(topCategory.amount)}.`
      : 'I do not see a clear spending category yet.';

    const cushion = Math.max(snapshot.balance * 0.2, snapshot.monthlyDebits * 0.25);

    return `You have spent ${formatMoney(snapshot.monthlyDebits)} this month and received ${formatMoney(snapshot.monthlyCredits)}. ${biggestSpend} Weekly spend is ${formatMoney(snapshot.weeklyDebits)} and yearly spend is ${formatMoney(snapshot.yearlyDebits)}. If you want a cautious buffer, try keeping around ${formatMoney(cushion)} untouched.`;
  }

  if (includesAny(input, ['transfer', 'send', 'pay', 'recipient'])) {
    const cushion = Math.max(snapshot.balance * 0.15, snapshot.monthlyDebits * 0.2);
    const safeAmount = Math.max(snapshot.balance - cushion, 0);

    return `Based on your current balance of ${balanceText}, a cautious amount to keep free is about ${formatMoney(
      cushion
    )}. That leaves roughly ${formatMoney(safeAmount)} available for a transfer, assuming you want a buffer for the rest of the month.`;
  }

  if (includesAny(input, ['income', 'salary', 'credit', 'deposit'])) {
    return snapshot.largestCredit
      ? `Your largest credit is ${snapshot.largestCredit.name} for ${formatMoney(snapshot.largestCredit.amount)}. This month you received ${formatMoney(
          snapshot.monthlyCredits
        )} in total, weekly income is ${formatMoney(snapshot.weeklyCredits)}, and yearly income is ${formatMoney(snapshot.yearlyCredits)}.`
      : `I do not see enough credit history yet, but your current balance is ${balanceText}.`;
  }

  if (includesAny(input, ['loan', 'emi', 'interest'])) {
    return `I can help you think through loans too. Your passbook shows ${formatMoney(
      snapshot.monthlyDebits
    )} in debits this month, so I can estimate room for an EMI if you tell me the amount and tenure.`;
  }

  if (includesAny(input, ['latest', 'recent', 'last'])) {
    return latestEntry
      ? `Your latest transaction is ${latestEntry.name} for ${formatMoney(Math.abs(latestEntry.amount))}. The running balance after it is ${formatMoney(
          latestEntry.closingBalance
        )}.`
      : 'I do not see a recent passbook entry yet.';
  }

  if (topCategory) {
    return `I can see a spending pattern around ${topCategory.category}. Your balance is ${balanceText}, monthly net is ${snapshot.monthlyNet >= 0 ? 'positive' : 'negative'} by ${monthlyNetText}, weekly net is ${formatMoney(snapshot.weeklyNet)}, and yearly net is ${formatMoney(snapshot.yearlyNet)}. Ask me for a distribution, account health check, or manager-style advice, and I will answer directly.`;
  }

  return `I connected to your passbook and found a balance of ${balanceText}. Ask me for spending distribution, account health, category breakdowns, or what to do next, and I will respond with a simple rule-based plan.`;
}