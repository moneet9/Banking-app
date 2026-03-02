import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { TrendingUp, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { getManagerReports } from '../../services/bankingApi';

const emptyData = {
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

export default function ManagerReports() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState(emptyData);

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

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: formatINR(reports.kpis.totalRevenue),
        change: formatPercent(reports.kpis.totalRevenueChange),
        icon: TrendingUp,
        positive: reports.kpis.totalRevenueChange >= 0,
      },
      {
        label: 'Net Profit',
        value: formatINR(reports.kpis.netProfit),
        change: formatPercent(reports.kpis.netProfitChange),
        icon: TrendingUp,
        positive: reports.kpis.netProfitChange >= 0,
      },
      {
        label: 'Total Customers',
        value: reports.kpis.totalCustomers.toLocaleString('en-IN'),
        change: formatPercent(reports.kpis.totalCustomersChange),
        icon: Users,
        positive: reports.kpis.totalCustomersChange >= 0,
      },
      {
        label: 'Default Rate',
        value: `${reports.kpis.defaultRate.toFixed(2)}%`,
        change: formatPercent(reports.kpis.defaultRateChange),
        icon: FileText,
        positive: reports.kpis.defaultRateChange <= 0,
      },
    ],
    [reports]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial overview and performance metrics</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {isLoading && <p className="text-sm text-gray-600 mb-4">Loading manager reports...</p>}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiCards.map((kpi) => (
              <Card key={kpi.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <kpi.icon className="w-6 h-6 text-gray-600" />
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    kpi.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
              </Card>
            ))}
          </div>

          {/* Financial Overview */}
          <Card className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Overview (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={reports.financialData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="revenue" stroke="#0066FF" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="#00C853" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </div>
      </div>
    </div>
  );
}
