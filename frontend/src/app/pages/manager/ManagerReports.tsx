import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { Users, FileText, CheckCircle2, AlertTriangle, TrendingUp, Wallet, PiggyBank, Percent } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import { getManagerReports, type ManagerReportsData } from '../../services/bankingApi';

const emptyData: ManagerReportsData = {
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

interface LoanMixPoint {
  name: string;
  value: number;
  color: string;
}

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatSignedPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function ManagerReports() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ManagerReportsData>(emptyData);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const data = await getManagerReports();
        setReports(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load reports');
        navigate('/manager/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [navigate]);

  const pendingLoans = Math.max(reports.totalLoans - reports.approvedLoans - reports.rejectedLoans, 0);
  const approvalRate = reports.totalLoans > 0 ? (reports.approvedLoans / reports.totalLoans) * 100 : 0;
  const totalExpenses = useMemo(
    () => reports.financialData.reduce<number>((sum, row) => sum + row.expenses, 0),
    [reports.financialData]
  );
  const expenseRatio = reports.kpis.totalRevenue > 0 ? (totalExpenses / reports.kpis.totalRevenue) * 100 : 0;
  const profitMargin = reports.kpis.totalRevenue > 0 ? (reports.kpis.netProfit / reports.kpis.totalRevenue) * 100 : 0;

  const financialKpis = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: formatINR(reports.kpis.totalRevenue),
        helper: `Change: ${formatSignedPercent(reports.kpis.totalRevenueChange)}`,
        icon: TrendingUp,
      },
      {
        label: 'Total Expenses',
        value: formatINR(totalExpenses),
        helper: `Expense Ratio: ${formatPercent(expenseRatio)}`,
        icon: Wallet,
      },
      {
        label: 'Net Profit',
        value: formatINR(reports.kpis.netProfit),
        helper: `Change: ${formatSignedPercent(reports.kpis.netProfitChange)}`,
        icon: PiggyBank,
      },
      {
        label: 'Profit Margin',
        value: formatPercent(profitMargin),
        helper: `Default Rate: ${formatPercent(reports.kpis.defaultRate)}`,
        icon: Percent,
      },
    ],
    [expenseRatio, profitMargin, reports, totalExpenses]
  );

  const operationalKpis = useMemo(
    () => [
      {
        label: 'Total Customers',
        value: reports.customerCount.toLocaleString('en-IN'),
        helper: `Growth: ${formatSignedPercent(reports.kpis.totalCustomersChange)}`,
        icon: Users,
      },
      {
        label: 'Total Loans',
        value: reports.totalLoans.toLocaleString('en-IN'),
        helper: `${reports.approvedLoans.toLocaleString('en-IN')} approved / ${reports.rejectedLoans.toLocaleString('en-IN')} rejected`,
        icon: FileText,
      },
      {
        label: 'Approval Rate',
        value: formatPercent(approvalRate),
        helper: `${pendingLoans.toLocaleString('en-IN')} pending`,
        icon: CheckCircle2,
      },
      {
        label: 'Default Rate',
        value: formatPercent(reports.kpis.defaultRate),
        helper: `Change: ${formatSignedPercent(reports.kpis.defaultRateChange)}`,
        icon: AlertTriangle,
      },
    ],
    [approvalRate, pendingLoans, reports]
  );

  const loanMix = useMemo<LoanMixPoint[]>(
    () => [
      { name: 'Approved', value: reports.approvedLoans, color: '#16A34A' },
      { name: 'Rejected', value: reports.rejectedLoans, color: '#DC2626' },
      { name: 'Pending', value: pendingLoans, color: '#F59E0B' },
    ].filter((item) => item.value > 0),
    [pendingLoans, reports.approvedLoans, reports.rejectedLoans]
  );

  const loanMixData: LoanMixPoint[] = loanMix.length
    ? loanMix
    : [{ name: 'No Data', value: 1, color: '#D1D5DB' }];

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Unified financial and operational analytics in one place</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {isLoading && <p className="text-sm text-gray-600 mb-4">Loading manager reports...</p>}

          <h2 className="text-lg font-bold text-gray-900 mb-4">Financial KPIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {financialKpis.map((kpi) => (
              <Card key={kpi.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <kpi.icon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
                <p className="text-xs text-gray-500 mt-2">{kpi.helper}</p>
              </Card>
            ))}
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">Operational KPIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {operationalKpis.map((kpi) => (
              <Card key={kpi.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <kpi.icon className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
                <p className="text-xs text-gray-500 mt-2">{kpi.helper}</p>
              </Card>
            ))}
          </div>

          <Card className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue vs Expenses vs Profit</h3>
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={reports.financialData}>
                <defs>
                  <linearGradient id="unifiedRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="unifiedExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EA580C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EA580C" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="unifiedProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fillOpacity={1} fill="url(#unifiedRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#EA580C" fillOpacity={1} fill="url(#unifiedExpenses)" name="Expenses" />
                <Area type="monotone" dataKey="profit" stroke="#16A34A" fillOpacity={1} fill="url(#unifiedProfit)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Loan Performance */}
            <Card className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.loanPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }} />
                  <Legend />
                  <Bar dataKey="disbursed" fill="#0066FF" radius={[8, 8, 0, 0]} name="Disbursed" />
                  <Bar dataKey="repaid" fill="#00C853" radius={[8, 8, 0, 0]} name="Repaid" />
                  <Bar dataKey="defaulted" fill="#FF6D00" radius={[8, 8, 0, 0]} name="Defaulted" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Customer Growth */}
            <Card className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reports.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }} />
                  <Line type="monotone" dataKey="customers" stroke="#AA00FF" strokeWidth={3} dot={{ r: 5 }} name="Total Customers" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Current Loan Decision Mix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanMixData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={110}
                    dataKey="value"
                  >
                    {loanMixData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-white rounded-2xl border border-gray-200 p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Financial Snapshot</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expenses</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Profit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.financialData.map((row) => {
                      const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                      return (
                        <tr key={row.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.month}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatINR(row.revenue)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatINR(row.expenses)}</td>
                          <td className={`px-4 py-3 text-sm font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatINR(row.profit)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatPercent(margin)}</td>
                        </tr>
                      );
                    })}
                    {!reports.financialData.length && !isLoading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          No financial history available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
