import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, IndianRupee, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
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

function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ManagerReportsData>(emptyData);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await getManagerReports();
        setReports(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load manager dashboard');
        navigate('/manager/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const pendingLoans = Math.max(reports.totalLoans - reports.approvedLoans - reports.rejectedLoans, 0);

  const kpiData = useMemo(
    () => [
      {
        label: 'Total Customers',
        value: reports.customerCount.toLocaleString('en-IN'),
        icon: Users,
        color: 'bg-blue-500',
        change: formatPercent(reports.kpis.totalCustomersChange),
      },
      {
        label: 'Total Revenue',
        value: formatINR(reports.kpis.totalRevenue),
        icon: TrendingUp,
        color: 'bg-green-500',
        change: formatPercent(reports.kpis.totalRevenueChange),
      },
      {
        label: 'Net Profit',
        value: formatINR(reports.kpis.netProfit),
        icon: IndianRupee,
        color: 'bg-purple-500',
        change: formatPercent(reports.kpis.netProfitChange),
      },
      {
        label: 'Pending Approvals',
        value: pendingLoans.toLocaleString('en-IN'),
        icon: FileText,
        color: 'bg-orange-500',
        change: `${reports.totalLoans.toLocaleString('en-IN')} total loans`,
      },
    ],
    [pendingLoans, reports]
  );

  const loanDistribution = useMemo(
    () => [
      { name: 'Approved', value: reports.approvedLoans, color: '#16A34A' },
      { name: 'Rejected', value: reports.rejectedLoans, color: '#DC2626' },
      { name: 'Pending', value: pendingLoans, color: '#F59E0B' },
    ].filter((item) => item.value > 0),
    [pendingLoans, reports.approvedLoans, reports.rejectedLoans]
  );

  const transactionTrends = useMemo(
    () =>
      reports.financialData.map((item) => ({
        month: item.month,
        credits: item.revenue,
        debits: item.expenses,
      })),
    [reports.financialData]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Executive performance and portfolio overview</p>
        </div>

        <div className="p-8">
          {isLoading && <p className="text-sm text-gray-600 mb-4">Loading manager dashboard...</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi) => (
              <Card key={kpi.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${kpi.color} rounded-xl flex items-center justify-center`}>
                    <kpi.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    kpi.change.startsWith('+') ? 'text-green-600' : kpi.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {kpi.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 rounded-2xl bg-white border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports.financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    formatter={(value: number) => formatINR(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                  />
                  <Bar dataKey="revenue" fill="#0066FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 rounded-2xl bg-white border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanDistribution.length ? loanDistribution : [{ name: 'No Data', value: 1, color: '#D1D5DB' }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {(loanDistribution.length ? loanDistribution : [{ name: 'No Data', value: 1, color: '#D1D5DB' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6 rounded-2xl bg-white border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Credits vs Debits Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="credits" stroke="#00C853" strokeWidth={2} name="Credits" />
                <Line type="monotone" dataKey="debits" stroke="#FF6D00" strokeWidth={2} name="Debits" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
