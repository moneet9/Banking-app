import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, CheckCircle2, RefreshCw, Send, Shield, Sparkles, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  getManagerCustomerPassbook,
  getManagerCustomers,
  getManagerLoanRates,
  getManagerReports,
  getManagerStaffMembers,
  getManagerStaffActivityLogs,
  getStaffDashboard,
  updateManagerLoanRates,
  type BankingUser,
  type LoanRateItem,
  type ManagerReportsData,
  type PassbookResponse,
  type StaffDashboardData,
  type StaffActivityLogItem,
  type StaffDashboardRecentLoan,
  type StaffMemberItem,
  type StaffCustomerAccount,
} from '../../services/bankingApi';
import { runManagerAdvisor, type ManagerAdvisorResult } from '../../utils/managerAdvisor';

const emptyReports: ManagerReportsData = {
  role: 'manager',
  customerCount: 0,
  totalLoans: 0,
  approvedLoans: 0,
  rejectedLoans: 0,
  kpis: {
    totalRevenue: 0,
    totalRevenueChange: 0,
    netProfit: 0,
    netProfitChange: 0,
    totalCustomers: 0,
    totalCustomersChange: 0,
    defaultRate: 0,
    defaultRateChange: 0,
  },
  financialData: [],
  loanPerformance: [],
  customerGrowth: [],
};

const defaultQuestions = [
  'What loan rates should I set right now?',
  'How is the bank profit health?',
  'Show me staff log pressure and risk.',
  'What rate should I give a risky customer?',
  'Explain how the model coordinates.',
];

const loanTypeLabels: Record<LoanRateItem['loanType'], string> = {
  personal: 'Personal',
  home: 'Home',
  auto: 'Auto',
  business: 'Business',
};

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function ManagerAdvisorPage() {
  const [reports, setReports] = useState<ManagerReportsData>(emptyReports);
  const [staffLogs, setStaffLogs] = useState<StaffActivityLogItem[]>([]);
  const [loanRates, setLoanRates] = useState<LoanRateItem[]>([]);
  const [customers, setCustomers] = useState<StaffCustomerAccount[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>([]);
  const [staffDashboard, setStaffDashboard] = useState<StaffDashboardData | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerPassbook, setSelectedCustomerPassbook] = useState<PassbookResponse | null>(null);
  const [question, setQuestion] = useState(defaultQuestions[0]);
  const [analysis, setAnalysis] = useState<ManagerAdvisorResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadManagerData = async () => {
      try {
        setIsLoading(true);
        const [reportsData, staffData, ratesData, customerData] = await Promise.all([
          getManagerReports(),
          getManagerStaffActivityLogs(),
          getManagerLoanRates(),
          getManagerCustomers(customerSearch),
        ]);

        const [staffMemberData, staffDashboardData] = await Promise.all([getManagerStaffMembers(), getStaffDashboard()]);

        setReports(reportsData);
        setStaffLogs(staffData);
        setLoanRates(ratesData);
        setCustomers(customerData);
        setStaffMembers(staffMemberData);
        setStaffDashboard(staffDashboardData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load manager advisor data');
      } finally {
        setIsLoading(false);
      }
    };

    loadManagerData();
  }, [customerSearch]);

  useEffect(() => {
    const loadCustomerPassbook = async () => {
      if (!selectedCustomerId) {
        setSelectedCustomerPassbook(null);
        return;
      }

      try {
        const passbook = await getManagerCustomerPassbook(selectedCustomerId);
        setSelectedCustomerPassbook(passbook);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load customer passbook');
        setSelectedCustomerPassbook(null);
      }
    };

    loadCustomerPassbook();
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo<BankingUser | null>(() => {
    if (!selectedCustomerId) {
      return null;
    }

    const found = customers.find((customer) => customer.id === selectedCustomerId);
    if (!found) {
      return null;
    }

    return {
      id: found.id,
      fullName: found.fullName,
      email: found.email,
      role: 'customer',
      phone: found.phone,
      accountNumber: found.accountNumber,
      balance: found.balance,
      memberSince: found.memberSince,
    };
  }, [customers, selectedCustomerId]);

  const runAdvisor = (prompt: string) => {
    if (!reports) {
      return;
    }

    setIsRunning(true);

    try {
      const result = runManagerAdvisor(
        prompt,
        reports,
        loanRates,
        staffLogs,
        staffMembers,
        staffDashboard,
        selectedCustomer,
        selectedCustomerPassbook
      );
      setAnalysis(result);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!isLoading && reports.customerCount >= 0) {
      runAdvisor(question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, reports, loanRates, staffLogs, staffMembers, staffDashboard, selectedCustomerPassbook, selectedCustomerId]);

  const selectedCustomerLabel = selectedCustomer
    ? `${selectedCustomer.fullName} (${selectedCustomer.accountNumber})`
    : 'No customer selected';

  const handleApplyRates = async () => {
    if (!analysis) {
      return;
    }

    try {
      setIsSaving(true);
      const payload = analysis.rateRecommendations.reduce(
        (acc, item) => {
          acc[item.loanType] = Number(item.recommendedRate.toFixed(2));
          return acc;
        },
        {} as Partial<Record<LoanRateItem['loanType'], number>>
      );

      const updated = await updateManagerLoanRates(payload);
      setLoanRates(updated);
      toast.success('Recommended rates applied');
      runAdvisor(question);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply recommended rates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ManagerSidebar />

      <div className="flex-1 overflow-auto">
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manager AI Advisor</h1>
              <p className="mt-1 text-sm text-slate-600">Multi-agent guidance for staff audits, profit health, customer risk, and loan pricing.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Coordinator trace visible below
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-8 xl:grid-cols-[300px_1fr_360px]">
          <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Customer Scope</h2>
                <p className="text-xs text-slate-500">Optional customer health input</p>
              </div>
              <Users className="h-4 w-4 text-slate-500" />
            </div>

            <Input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search customers"
              className="mb-3 h-11 rounded-xl"
            />

            <select
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
              className="mb-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
            >
              <option value="">No customer selected</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </select>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected customer</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedCustomerLabel}</p>
              {selectedCustomerPassbook && (
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p>Balance: {formatINR(selectedCustomerPassbook.balance)}</p>
                  <p>Entries: {selectedCustomerPassbook.entries.length}</p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {defaultQuestions.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setQuestion(item);
                    runAdvisor(item);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    <Bot className="h-3.5 w-3.5" />
                    Coordinator
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Ask the manager bot</h2>
                  <p className="text-sm text-slate-500">It combines bank health, staff logs, customer risk, and current loan rates.</p>
                </div>
                <Button
                  onClick={() => runAdvisor(question)}
                  disabled={isLoading || isRunning}
                  className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isRunning ? 'Analyzing...' : 'Run Coordinator'}
                </Button>
              </div>

              <div className="space-y-4">
                <Textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about profit, staff logs, customer risk, or loan rates..."
                  className="min-h-[120px] rounded-2xl border-slate-200 bg-slate-50 text-base"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => runAdvisor(question)}
                    disabled={isLoading || isRunning}
                    className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Question
                  </Button>
                  <Button
                    onClick={handleApplyRates}
                    disabled={!analysis || isSaving}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isSaving ? 'Applying...' : 'Apply Recommended Rates'}
                  </Button>
                </div>

                {analysis ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    {analysis.answer}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Run the coordinator to generate a recommendation.
                  </div>
                )}
              </div>
            </Card>

            {analysis && (
              <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Employee Hierarchy</h3>
                <p className="mt-1 text-sm text-slate-500">Sorted by workload score from the multi-model advisor.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {analysis.employeeInsights.slice(0, 6).map((staff) => (
                    <div key={staff.staffId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">#{staff.rank} {staff.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{staff.activityCount} actions • {staff.workLabel} workload</p>
                      <p className="mt-2 text-sm text-slate-600">Work score: {staff.workloadScore}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {analysis && (
              <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Customer Loan Reporting</h3>
                <p className="mt-1 text-sm text-slate-500">Visible recent loan activity and customer-level loan totals.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {analysis.loanInsights.slice(0, 6).map((loan, index) => (
                    <div key={`${loan.customerName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{loan.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{loan.loanType} • {loan.status}</p>
                      <p className="mt-2 text-sm text-slate-700">{formatINR(loan.amount)}</p>
                    </div>
                  ))}
                </div>
                {staffDashboard?.recentLoans && staffDashboard.recentLoans.length > 0 && (
                  <p className="mt-4 text-sm text-slate-600">
                    Recent loan sample count: {staffDashboard.recentLoans.length}. Total loan volume from sample: {formatINR(staffDashboard.recentLoans.reduce((sum, loan) => sum + loan.amount, 0))}.
                  </p>
                )}
              </Card>
            )}

            {analysis && (
              <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Model Ensemble</h3>
                    <p className="text-sm text-slate-500">Multiple specialized models contribute, then the coordinator picks the strongest signal.</p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Selected: {analysis.selectedModel}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {analysis.modelOutputs.map((model) => (
                    <div key={model.model} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{model.model}</p>
                        <span className="text-xs font-semibold text-slate-500">Confidence {(model.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{model.response}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Profit Margin</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{analysis ? analysis.bankHealth.profitMargin.toFixed(1) : '0.0'}%</p>
              </Card>
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Shield className="h-5 w-5 text-blue-600" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Default Rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{analysis ? analysis.bankHealth.defaultRate.toFixed(1) : '0.0'}%</p>
              </Card>
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Activity className="h-5 w-5 text-amber-600" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Staff Logs</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{analysis ? analysis.staffHealth.totalLogs.toLocaleString('en-IN') : '0'}</p>
              </Card>
              <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer Risk</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{analysis ? analysis.customerHealth.risk.toUpperCase() : 'N/A'}</p>
              </Card>
            </div>

            <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Recommended Rates</h3>
              <p className="mt-1 text-sm text-slate-500">These are adjusted by bank health and selected customer risk.</p>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {(analysis?.rateRecommendations || []).map((item) => (
                  <div key={item.loanType} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{loanTypeLabels[item.loanType]}</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{item.recommendedRate.toFixed(2)}%</p>
                    <p className="text-xs text-slate-500">Current: {item.currentRate.toFixed(2)}% | Delta: {formatPercent(item.delta)}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{item.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <h3 className="text-base font-semibold text-slate-900">Coordination Trace</h3>
              </div>
              <div className="mt-4 space-y-3">
                {analysis?.trace.map((step) => (
                  <div key={step.agent} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{step.agent}</p>
                    <p className="mt-1 text-xs text-slate-500">{step.summary}</p>
                    <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
                      {step.details.map((detail) => (
                        <li key={detail}>• {detail}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!analysis && <p className="text-sm text-slate-500">Run the coordinator to see the agent workflow.</p>}
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Bank Health Summary</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Revenue: {analysis ? formatINR(analysis.bankHealth.revenue) : formatINR(0)}</p>
                <p>Profit: {analysis ? formatINR(analysis.bankHealth.profit) : formatINR(0)}</p>
                <p>Status: {analysis ? analysis.bankHealth.status : 'stable'}</p>
                <p>Customer risk: {analysis ? analysis.customerHealth.risk : 'medium'}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
