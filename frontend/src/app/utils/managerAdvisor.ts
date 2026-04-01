import type {
  BankingUser,
  StaffDashboardData,
  StaffDashboardRecentLoan,
  StaffMemberItem,
  LoanRateItem,
  ManagerReportsData,
  PassbookResponse,
  StaffActivityLogItem,
} from '../services/bankingApi';

export type ManagerAdvisorLoanType = 'personal' | 'home' | 'auto' | 'business';

export interface ManagerAdvisorTraceItem {
  agent: string;
  summary: string;
  details: string[];
}

export interface ManagerAdvisorModelOutput {
  model: string;
  response: string;
  confidence: number;
}

export interface ManagerAdvisorRateRecommendation {
  loanType: ManagerAdvisorLoanType;
  currentRate: number;
  recommendedRate: number;
  delta: number;
  reason: string;
}

export interface ManagerAdvisorEmployeeInsight {
  staffId: string;
  name: string;
  activityCount: number;
  workloadScore: number;
  workLabel: 'light' | 'steady' | 'busy' | 'heavy';
  rank: number;
}

export interface ManagerAdvisorLoanInsight {
  customerName: string;
  amount: number;
  loanType: string;
  status: string;
}

export interface ManagerAdvisorResult {
  answer: string;
  selectedModel: string;
  modelOutputs: ManagerAdvisorModelOutput[];
  trace: ManagerAdvisorTraceItem[];
  rateRecommendations: ManagerAdvisorRateRecommendation[];
  employeeInsights: ManagerAdvisorEmployeeInsight[];
  loanInsights: ManagerAdvisorLoanInsight[];
  bankHealth: {
    profitMargin: number;
    defaultRate: number;
    revenue: number;
    profit: number;
    status: 'strong' | 'stable' | 'weak';
  };
  staffHealth: {
    totalLogs: number;
    topAction: string;
    auditTone: 'clean' | 'busy' | 'risk';
  };
  customerHealth: {
    selectedCustomer?: BankingUser | null;
    balance: number;
    monthlyNet: number;
    risk: 'low' | 'medium' | 'high';
    notes: string[];
  };
}

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return moneyFormatter.format(amount);
}

function roundToStep(value: number, step = 0.25) {
  return Math.round(value / step) * step;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function percentOf(value: number) {
  return `${value.toFixed(1)}%`;
}

function buildBankHealth(reports: ManagerReportsData) {
  const profitMargin = reports.kpis.totalRevenue > 0 ? (reports.kpis.netProfit / reports.kpis.totalRevenue) * 100 : 0;
  const defaultRate = reports.kpis.defaultRate;

  let status: 'strong' | 'stable' | 'weak' = 'stable';

  if (profitMargin >= 25 && defaultRate <= 3) {
    status = 'strong';
  } else if (profitMargin < 10 || defaultRate >= 7) {
    status = 'weak';
  }

  return {
    profitMargin,
    defaultRate,
    revenue: reports.kpis.totalRevenue,
    profit: reports.kpis.netProfit,
    status,
  };
}

function buildStaffHealth(logs: StaffActivityLogItem[]) {
  const actionCounts = new Map<string, number>();
  logs.forEach((log) => {
    actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
  });

  const [topAction = 'NONE'] = [...actionCounts.entries()].sort((left, right) => right[1] - left[1]).map(([action]) => action);

  let auditTone: 'clean' | 'busy' | 'risk' = 'clean';
  if (logs.length >= 40) {
    auditTone = 'busy';
  }
  if ([...actionCounts.keys()].some((action) => action.includes('REJECT') || action.includes('WITHDRAWAL'))) {
    auditTone = logs.length >= 15 ? 'risk' : 'busy';
  }

  return {
    totalLogs: logs.length,
    topAction,
    auditTone,
  };
}

function buildCustomerHealth(selectedCustomer: BankingUser | null | undefined, passbook: PassbookResponse | null) {
  if (!selectedCustomer || !passbook) {
    return {
      selectedCustomer: selectedCustomer || null,
      balance: 0,
      monthlyNet: 0,
      risk: 'medium' as const,
      notes: ['No customer selected.'],
    };
  }

  const entries = passbook.entries || [];
  const balance = Number(passbook.balance || selectedCustomer.balance || 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyEntries = entries.filter((entry) => new Date(entry.timestamp).getTime() >= monthStart.getTime());
  const credits = monthlyEntries.filter((entry) => entry.type === 'credit').reduce((sum, entry) => sum + entry.amount, 0);
  const debits = monthlyEntries.filter((entry) => entry.type === 'debit').reduce((sum, entry) => sum + entry.amount, 0);
  const monthlyNet = credits - debits;
  const largestDebit = monthlyEntries
    .filter((entry) => entry.type === 'debit')
    .sort((left, right) => right.amount - left.amount)[0];

  const notes: string[] = [];
  let risk: 'low' | 'medium' | 'high' = 'medium';

  if (balance <= 0) {
    risk = 'high';
    notes.push('Customer balance is non-positive.');
  } else if (balance < selectedCustomer.balance * 0.2) {
    risk = 'medium';
    notes.push('Balance buffer is thin compared with account size.');
  } else {
    notes.push('Customer balance buffer is healthy.');
  }

  if (monthlyNet < 0) {
    risk = 'high';
    notes.push(`Monthly net is negative by ${formatMoney(Math.abs(monthlyNet))}.`);
  } else if (monthlyNet < credits * 0.1) {
    risk = risk === 'high' ? 'high' : 'medium';
    notes.push('Monthly cash flow is positive but small.');
  } else {
    notes.push('Monthly cash flow is positive.');
  }

  if (largestDebit && largestDebit.amount > Math.max(balance * 0.35, 1)) {
    notes.push(`Largest debit ${formatMoney(largestDebit.amount)} is sizable relative to balance.`);
    risk = risk === 'low' ? 'medium' : 'high';
  }

  return {
    selectedCustomer,
    balance,
    monthlyNet,
    risk,
    notes,
  };
}

function buildEmployeeInsights(staffMembers: StaffMemberItem[], logs: StaffActivityLogItem[]) {
  const activityMap = new Map<string, number>();
  const actionMap = new Map<string, number>();

  logs.forEach((log) => {
    const staffId = log.actor?.id || 'unassigned';
    activityMap.set(staffId, (activityMap.get(staffId) || 0) + 1);
    actionMap.set(log.action, (actionMap.get(log.action) || 0) + 1);
  });

  const insights = staffMembers
    .map((staff) => {
      const activityCount = activityMap.get(staff.id) || 0;
      const workloadScore = activityCount * 2 + (staff.fullName.length % 5);
      let workLabel: 'light' | 'steady' | 'busy' | 'heavy' = 'light';

      if (workloadScore >= 24) {
        workLabel = 'heavy';
      } else if (workloadScore >= 14) {
        workLabel = 'busy';
      } else if (workloadScore >= 6) {
        workLabel = 'steady';
      }

      return {
        staffId: staff.id,
        name: staff.fullName,
        activityCount,
        workloadScore,
        workLabel,
        rank: 0,
      };
    })
    .sort((left, right) => right.workloadScore - left.workloadScore)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return {
    insights,
    totalActivities: logs.length,
    topAction: [...actionMap.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'NONE',
    busiest: insights[0] || null,
    leastBusy: insights[insights.length - 1] || null,
  };
}

function buildLoanInsights(recentLoans: StaffDashboardRecentLoan[], selectedCustomer?: BankingUser | null) {
  const insights = recentLoans.map((loan) => ({
    customerName: loan.customer,
    amount: loan.amount,
    loanType: loan.type,
    status: loan.status,
  }));

  const selectedCustomerLoans = selectedCustomer
    ? insights.filter((loan) => loan.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase())
    : [];

  return {
    insights,
    totalLoanVolume: insights.reduce((sum, loan) => sum + loan.amount, 0),
    largestLoan: insights.sort((left, right) => right.amount - left.amount)[0] || null,
    selectedCustomerLoans,
  };
}

function rateShiftForBank(status: 'strong' | 'stable' | 'weak') {
  if (status === 'strong') {
    return -0.25;
  }

  if (status === 'weak') {
    return 0.75;
  }

  return 0;
}

function rateShiftForCustomer(risk: 'low' | 'medium' | 'high') {
  if (risk === 'low') {
    return -0.25;
  }

  if (risk === 'high') {
    return 0.75;
  }

  return 0.25;
}

function buildRateRecommendation(
  loanType: ManagerAdvisorLoanType,
  currentRate: number,
  bankStatus: 'strong' | 'stable' | 'weak',
  customerRisk: 'low' | 'medium' | 'high'
): ManagerAdvisorRateRecommendation {
  const typeWeight: Record<ManagerAdvisorLoanType, number> = {
    personal: 1.1,
    home: -0.4,
    auto: 0.3,
    business: 0.8,
  };

  const baseShift = rateShiftForBank(bankStatus) + rateShiftForCustomer(customerRisk) + typeWeight[loanType];
  const recommendedRate = roundToStep(clamp(currentRate + baseShift, 4, 20), 0.25);
  const delta = Number((recommendedRate - currentRate).toFixed(2));

  const reasonParts = [
    bankStatus === 'strong'
      ? 'bank profits and default metrics support a slightly lower price'
      : bankStatus === 'weak'
        ? 'bank profitability or default pressure suggests keeping a wider spread'
        : 'bank health is balanced, so the recommendation stays near the current rate',
    customerRisk === 'low'
      ? 'customer risk looks low'
      : customerRisk === 'high'
        ? 'customer cash flow looks stressed'
        : 'customer risk is moderate',
  ];

  const loanReason =
    loanType === 'home'
      ? 'home loans are secured and can price tighter'
      : loanType === 'business'
        ? 'business loans carry more uncertainty and need a wider cushion'
        : loanType === 'personal'
          ? 'personal loans are unsecured, so pricing stays higher'
          : 'auto loans usually sit between secured and unsecured pricing';

  return {
    loanType,
    currentRate,
    recommendedRate,
    delta,
    reason: `${reasonParts.join(', ')} and ${loanReason}.`,
  };
}

function buildBankModel(question: string, bankHealth: ReturnType<typeof buildBankHealth>) {
  const normalizedQuestion = question.toLowerCase();
  const confidence = bankHealth.status === 'strong' ? 0.88 : bankHealth.status === 'weak' ? 0.8 : 0.84;

  if (normalizedQuestion.includes('profit') || normalizedQuestion.includes('health') || normalizedQuestion.includes('bank')) {
    return {
      model: 'Bank Profit Model',
      confidence,
      response: bankHealth.status === 'strong'
        ? `Bank profit health is strong. Margin is ${percentOf(bankHealth.profitMargin)} and default rate is ${percentOf(bankHealth.defaultRate)}. You can keep pricing slightly competitive.`
        : bankHealth.status === 'weak'
          ? `Bank profit health is weak. Margin is ${percentOf(bankHealth.profitMargin)} and default rate is ${percentOf(bankHealth.defaultRate)}. Keep pricing wider and reduce risk.`
          : `Bank profit health is balanced. Margin is ${percentOf(bankHealth.profitMargin)} and default rate is ${percentOf(bankHealth.defaultRate)}. Stay close to current pricing.`,
    };
  }

  return {
    model: 'Bank Profit Model',
    confidence,
    response: `Bank baseline: revenue ${formatMoney(bankHealth.revenue)}, profit ${formatMoney(bankHealth.profit)}, margin ${percentOf(bankHealth.profitMargin)}.`,
  };
}

function buildEmployeeModel(
  question: string,
  staffMembers: StaffMemberItem[],
  employeeInsights: ReturnType<typeof buildEmployeeInsights>
) {
  const normalizedQuestion = question.toLowerCase();
  const confidence = staffMembers.length > 0 ? Math.min(0.92, 0.72 + employeeInsights.insights.length / 100) : 0.6;

  const ranked = employeeInsights.insights.slice(0, 3);
  const hierarchyText = ranked.length
    ? ranked
        .map((staff) => `${staff.rank}. ${staff.name} (${staff.activityCount} actions, ${staff.workLabel})`)
        .join('; ')
    : 'No staff hierarchy data available.';

  if (normalizedQuestion.includes('employee') || normalizedQuestion.includes('hierarchy') || normalizedQuestion.includes('workload') || normalizedQuestion.includes('work')) {
    return {
      model: 'Employee Hierarchy Model',
      confidence,
      response: `Employee workload hierarchy: ${hierarchyText}. Top action across the bank is ${employeeInsights.topAction}.`,
    };
  }

  return {
    model: 'Employee Hierarchy Model',
    confidence,
    response: ranked.length
      ? `Employee baseline: busiest staff is ${ranked[0].name} with ${ranked[0].activityCount} actions.`
      : 'Employee baseline: no staff activity data available.',
  };
}

function buildLoanReportingModel(question: string, loanInsights: ReturnType<typeof buildLoanInsights>) {
  const normalizedQuestion = question.toLowerCase();
  const confidence = loanInsights.insights.length > 0 ? 0.88 : 0.62;

  if (normalizedQuestion.includes('loan') || normalizedQuestion.includes('customer report') || normalizedQuestion.includes('how much loan')) {
    const topLoan = loanInsights.largestLoan;
    return {
      model: 'Customer Loan Reporting Model',
      confidence,
      response: topLoan
        ? `Recent loan reporting shows ${loanInsights.insights.length} loans with total volume ${formatMoney(loanInsights.totalLoanVolume)}. Largest loan is ${topLoan.customerName} taking ${formatMoney(topLoan.amount)} as a ${topLoan.loanType} loan.`
        : 'No recent loan reporting data is available yet.',
    };
  }

  return {
    model: 'Customer Loan Reporting Model',
    confidence,
    response: loanInsights.insights.length
      ? `Loan baseline: ${loanInsights.insights.length} recent loans totalling ${formatMoney(loanInsights.totalLoanVolume)}.`
      : 'Loan baseline: no recent loans found.',
  };
}

function buildStaffModel(question: string, staffHealth: ReturnType<typeof buildStaffHealth>, logs: StaffActivityLogItem[]) {
  const normalizedQuestion = question.toLowerCase();
  const confidence = staffHealth.auditTone === 'risk' ? 0.9 : staffHealth.auditTone === 'busy' ? 0.76 : 0.7;

  if (normalizedQuestion.includes('log') || normalizedQuestion.includes('staff') || normalizedQuestion.includes('audit')) {
    return {
      model: 'Staff Audit Model',
      confidence,
      response: `Staff audit shows ${logs.length} logs, top action ${staffHealth.topAction}, and audit tone ${staffHealth.auditTone}. Tighten review on approvals, withdrawals, and unusual access if you want safer operations.`,
    };
  }

  return {
    model: 'Staff Audit Model',
    confidence,
    response: `Staff activity baseline: ${logs.length} logs with ${staffHealth.auditTone} audit tone and top action ${staffHealth.topAction}.`,
  };
}

function buildCustomerModel(question: string, customerHealth: ReturnType<typeof buildCustomerHealth>) {
  const normalizedQuestion = question.toLowerCase();
  const confidence = customerHealth.risk === 'high' ? 0.92 : customerHealth.risk === 'medium' ? 0.82 : 0.74;

  if (normalizedQuestion.includes('customer') || normalizedQuestion.includes('risk') || normalizedQuestion.includes('customer rate')) {
    return {
      model: 'Customer Risk Model',
      confidence,
      response: customerHealth.selectedCustomer
        ? `${customerHealth.selectedCustomer.fullName} is ${customerHealth.risk} risk with balance ${formatMoney(customerHealth.balance)}. ${customerHealth.notes.join(' ')}`
        : 'No customer selected, so customer-level risk stays unresolved.',
    };
  }

  return {
    model: 'Customer Risk Model',
    confidence,
    response: customerHealth.selectedCustomer
      ? `Customer baseline: ${customerHealth.selectedCustomer.fullName} is ${customerHealth.risk} risk with monthly net ${formatMoney(customerHealth.monthlyNet)}.`
      : 'Customer baseline: no customer selected.',
  };
}

function buildRateModel(
  question: string,
  rateRecommendations: ManagerAdvisorRateRecommendation[],
  bankHealth: ReturnType<typeof buildBankHealth>,
  customerHealth: ReturnType<typeof buildCustomerHealth>
) {
  const normalizedQuestion = question.toLowerCase();
  const sorted = [...rateRecommendations].sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
  const topRate = sorted[0];
  const confidence = bankHealth.status === 'strong' && customerHealth.risk === 'low' ? 0.9 : customerHealth.risk === 'high' ? 0.84 : 0.8;

  if (normalizedQuestion.includes('rate') || normalizedQuestion.includes('interest') || normalizedQuestion.includes('loan')) {
    return {
      model: 'Rate Strategy Model',
      confidence,
      response: topRate
        ? `Recommended headline move: ${topRate.loanType} loans from ${topRate.currentRate.toFixed(2)}% to ${topRate.recommendedRate.toFixed(2)}%. Lowest risk and strongest profit conditions justify tighter pricing; weaker health justifies wider pricing.`
        : 'Rate model has no baseline rate data yet.',
    };
  }

  return {
    model: 'Rate Strategy Model',
    confidence,
    response: topRate
      ? `Rate baseline: ${topRate.loanType} ${topRate.currentRate.toFixed(2)}% -> ${topRate.recommendedRate.toFixed(2)}%.`
      : 'Rate baseline unavailable.',
  };
}

function buildCoordinatorModel(question: string, modelOutputs: ManagerAdvisorModelOutput[]) {
  const sorted = [...modelOutputs].sort((left, right) => right.confidence - left.confidence);
  const selected = sorted[0];
  const response = [
    `Coordinator selected ${selected.model} as the strongest signal.`,
    selected.response,
    'Other models were still used as supporting signals, not ignored.',
  ].join(' ');

  return {
    model: 'Coordinator Model',
    confidence: Math.min(0.95, selected.confidence + 0.05),
    response: question.toLowerCase().includes('explain')
      ? response
      : selected.response,
  };
}

function buildEmployeeAdvice(employeeInsights: ReturnType<typeof buildEmployeeInsights>) {
  if (!employeeInsights.insights.length) {
    return 'No employee activity logs were found, so the hierarchy cannot be scored yet.';
  }

  const topThree = employeeInsights.insights.slice(0, 3);
  return `Employee hierarchy is led by ${topThree.map((item) => `${item.name} (${item.activityCount} actions, ${item.workLabel})`).join(', ')}. The busiest action type is ${employeeInsights.topAction}. Use this to rebalance workloads and assign more review load to lighter staff if needed.`;
}

function buildLoanAdvice(loanInsights: ReturnType<typeof buildLoanInsights>, selectedCustomer?: BankingUser | null) {
  if (!loanInsights.insights.length) {
    return 'No recent loans were found, so there is nothing to report yet.';
  }

  if (selectedCustomer) {
    if (loanInsights.selectedCustomerLoans.length) {
      const total = loanInsights.selectedCustomerLoans.reduce((sum, loan) => sum + loan.amount, 0);
      return `${selectedCustomer.fullName} has ${loanInsights.selectedCustomerLoans.length} recent loan record(s) totalling ${formatMoney(total)}. The biggest one is ${formatMoney(Math.max(...loanInsights.selectedCustomerLoans.map((loan) => loan.amount)))}.`;
    }

    return `${selectedCustomer.fullName} has no matching recent loan record in the visible sample, so I cannot confirm their loan amount from the current data.`;
  }

  return `Customer loan reporting shows ${loanInsights.insights.length} recent loans totalling ${formatMoney(loanInsights.totalLoanVolume)}. The largest is ${loanInsights.largestLoan ? `${loanInsights.largestLoan.customerName} taking ${formatMoney(loanInsights.largestLoan.amount)}` : 'not available'}.`;
}

function buildAnswer(
  question: string,
  reports: ManagerReportsData,
  employeeInsights: ReturnType<typeof buildEmployeeInsights>,
  loanInsights: ReturnType<typeof buildLoanInsights>,
  staffLogs: StaffActivityLogItem[],
  customerHealth: ReturnType<typeof buildCustomerHealth>,
  rateRecommendations: ManagerAdvisorRateRecommendation[]
) {
  const bankHealth = buildBankHealth(reports);
  const staffHealth = buildStaffHealth(staffLogs);
  const bankSummary = reports.kpis.netProfit >= 0 ? 'profit-positive' : 'loss-making';
  const customerSummary = customerHealth.selectedCustomer
    ? `${customerHealth.selectedCustomer.fullName} looks ${customerHealth.risk} risk with balance ${formatMoney(customerHealth.balance)}.`
    : 'No customer selected, so recommendations are based on bank health only.';
  const sortedRecommendations = [...rateRecommendations].sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
  const topRate = sortedRecommendations[0];
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes('log') || normalizedQuestion.includes('staff')) {
    return [
      `Staff activity is currently measured across ${staffLogs.length} logs.`,
      `The audit tone is ${staffHealth.auditTone}, and the top action is ${staffHealth.topAction}.`,
      'I would tighten monitoring on approvals, withdrawals, and unusual account access before changing rates.',
    ].join(' ');
  }

  if (normalizedQuestion.includes('employee') || normalizedQuestion.includes('hierarchy') || normalizedQuestion.includes('workload') || normalizedQuestion.includes('work')) {
    return buildEmployeeAdvice(employeeInsights);
  }

  if (normalizedQuestion.includes('loan') || normalizedQuestion.includes('customer report') || normalizedQuestion.includes('how much loan')) {
    return buildLoanAdvice(loanInsights, customerHealth.selectedCustomer || null);
  }

  if (normalizedQuestion.includes('profit') || normalizedQuestion.includes('health') || normalizedQuestion.includes('bank')) {
    return [
      `The bank is ${bankSummary} with profit margin ${percentOf(bankHealth.profitMargin)} and default rate ${percentOf(bankHealth.defaultRate)}.`,
      bankHealth.status === 'strong'
        ? 'That health supports slightly more competitive pricing.'
        : bankHealth.status === 'weak'
          ? 'That health calls for wider pricing cushions.'
          : 'That health supports staying close to current pricing.',
      'I combined revenue, profit, and default pressure before choosing the recommendation.',
    ].join(' ');
  }

  if (normalizedQuestion.includes('customer') || normalizedQuestion.includes('risk')) {
    return [
      customerSummary,
      customerHealth.selectedCustomer
        ? `Risk level is ${customerHealth.risk} because ${customerHealth.notes.join(' ')}`
        : 'Select a customer to see customer-level pricing guidance.',
      'Customer risk shifts the rate more than the bank average when cash flow is weak.',
    ].join(' ');
  }

  if (normalizedQuestion.includes('rate') || normalizedQuestion.includes('interest')) {
    return [
      'Here is the rate recommendation table for all loan types.',
      topRate
        ? `The largest move is ${topRate.loanType} from ${topRate.currentRate.toFixed(2)}% to ${topRate.recommendedRate.toFixed(2)}%.`
        : 'The current rates are already near the recommended range.',
      'Use lower rates when bank profit and customer risk are strong; use higher rates when either side is under pressure.',
    ].join(' ');
  }

  return [
    `The bank is currently ${bankSummary} with profit margin ${percentOf(bankHealth.profitMargin)} and default rate ${percentOf(bankHealth.defaultRate)}.`,
    `Staff audit shows ${staffLogs.length} activity logs and the most common action is ${staffHealth.topAction}.`,
    customerSummary,
    topRate
      ? `The strongest rate move is for ${topRate.loanType} loans: shift from ${topRate.currentRate.toFixed(2)}% to ${topRate.recommendedRate.toFixed(2)}%.`
      : 'Current rates can stay near their existing levels.',
    'I coordinated the recommendation by combining bank health, staff audit pressure, customer risk, and loan-type risk.',
  ].join(' ');
}

export function runManagerAdvisor(
  question: string,
  reports: ManagerReportsData,
  currentRates: LoanRateItem[],
  staffLogs: StaffActivityLogItem[],
  staffMembers: StaffMemberItem[] = [],
  staffDashboard: StaffDashboardData | null = null,
  selectedCustomer?: BankingUser | null,
  selectedCustomerPassbook?: PassbookResponse | null
): ManagerAdvisorResult {
  const bankHealth = buildBankHealth(reports);
  const staffHealth = buildStaffHealth(staffLogs);
  const customerHealth = buildCustomerHealth(selectedCustomer, selectedCustomerPassbook ?? null);
  const employeeInsights = buildEmployeeInsights(staffMembers, staffLogs);
  const loanInsights = buildLoanInsights(staffDashboard?.recentLoans || [], selectedCustomer ?? null);

  const baseRateMap: Record<ManagerAdvisorLoanType, number> = {
    personal: currentRates.find((item) => item.loanType === 'personal')?.rate ?? 10.5,
    home: currentRates.find((item) => item.loanType === 'home')?.rate ?? 7,
    auto: currentRates.find((item) => item.loanType === 'auto')?.rate ?? 8,
    business: currentRates.find((item) => item.loanType === 'business')?.rate ?? 11,
  };

  const rateRecommendations = (Object.keys(baseRateMap) as ManagerAdvisorLoanType[]).map((loanType) =>
    buildRateRecommendation(loanType, baseRateMap[loanType], bankHealth.status, customerHealth.risk)
  );

  const modelOutputs: ManagerAdvisorModelOutput[] = [
    buildBankModel(question, bankHealth),
    buildEmployeeModel(question, staffMembers, employeeInsights),
    buildStaffModel(question, staffHealth, staffLogs),
    buildCustomerModel(question, customerHealth),
    buildLoanReportingModel(question, loanInsights),
    buildRateModel(question, rateRecommendations, bankHealth, customerHealth),
  ];

  const coordinatorOutput = buildCoordinatorModel(question, modelOutputs);
  modelOutputs.push(coordinatorOutput);
  const selectedModel = [...modelOutputs].sort((left, right) => right.confidence - left.confidence)[0].model;

  const trace: ManagerAdvisorTraceItem[] = [
    {
      agent: 'Coordinator',
      summary: 'Orchestrated bank, staff, customer, and pricing signals.',
      details: [
        `Bank status: ${bankHealth.status}, profit margin ${percentOf(bankHealth.profitMargin)}, default rate ${percentOf(bankHealth.defaultRate)}.`,
        `Staff audit: ${staffHealth.totalLogs} logs, ${staffHealth.auditTone} audit tone.`,
        selectedCustomer ? `Customer: ${selectedCustomer.fullName}, risk ${customerHealth.risk}.` : 'Customer: none selected.',
      ],
    },
    {
      agent: 'Bank Health Agent',
      summary: `Evaluated revenue ${formatMoney(bankHealth.revenue)} and profit ${formatMoney(bankHealth.profit)}.`,
      details: [
        `Profit margin ${percentOf(bankHealth.profitMargin)}.`,
        `Default rate ${percentOf(bankHealth.defaultRate)}.`,
        bankHealth.status === 'strong'
          ? 'Health is strong enough to support slightly competitive pricing.'
          : bankHealth.status === 'weak'
            ? 'Health is weak, so pricing should preserve spread.'
            : 'Health is balanced, so pricing can stay near current levels.',
      ],
    },
    {
      agent: 'Staff Audit Agent',
      summary: `Reviewed ${staffHealth.totalLogs} staff activity logs with a ${staffHealth.auditTone} tone.`,
      details: [
        `Most common action: ${staffHealth.topAction}.`,
        staffHealth.auditTone === 'risk'
          ? 'Audit pressure suggests tighter operational oversight.'
          : staffHealth.auditTone === 'busy'
            ? 'Audit load is high, but not clearly risky.'
            : 'Audit load looks clean and manageable.',
      ],
    },
    {
      agent: 'Customer Risk Agent',
      summary: selectedCustomer
        ? `Selected customer ${selectedCustomer.fullName} is ${customerHealth.risk} risk.`
        : 'No customer selected; risk defaults to bank-level analysis.',
      details: customerHealth.notes.length ? customerHealth.notes : ['No customer passbook data available.'],
    },
    {
      agent: 'Rate Strategy Agent',
      summary: 'Generated loan-rate guidance for all loan types.',
      details: rateRecommendations.map(
        (item) => `${item.loanType.toUpperCase()}: ${item.currentRate.toFixed(2)}% -> ${item.recommendedRate.toFixed(2)}% (${item.reason})`
      ),
    },
  ];

  return {
    answer: buildAnswer(question, reports, employeeInsights, loanInsights, staffLogs, customerHealth, rateRecommendations),
    selectedModel,
    modelOutputs,
    trace,
    rateRecommendations,
    employeeInsights: employeeInsights.insights,
    loanInsights: loanInsights.insights,
    bankHealth,
    staffHealth,
    customerHealth,
  };
}
