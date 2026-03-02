import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { Users, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const kpiData = [
  { label: 'Total Customers', value: '1,245', icon: Users, color: 'bg-blue-500', change: '+12.5%' },
  { label: 'Total Revenue', value: '₹45.2M', icon: TrendingUp, color: 'bg-green-500', change: '+18.2%' },
  { label: 'Active Loans', value: '₹124.5M', icon: DollarSign, color: 'bg-purple-500', change: '+8.7%' },
  { label: 'Pending Approvals', value: '15', icon: FileText, color: 'bg-orange-500', change: '-3' },
];

const monthlyRevenue = [
  { month: 'Sep', revenue: 3200000 },
  { month: 'Oct', revenue: 3500000 },
  { month: 'Nov', revenue: 3800000 },
  { month: 'Dec', revenue: 4200000 },
  { month: 'Jan', revenue: 4000000 },
  { month: 'Feb', revenue: 4500000 },
];

const loanDistribution = [
  { name: 'Home Loans', value: 45, color: '#0066FF' },
  { name: 'Personal Loans', value: 25, color: '#00C853' },
  { name: 'Business Loans', value: 20, color: '#FF6D00' },
  { name: 'Car Loans', value: 10, color: '#AA00FF' },
];

const transactionTrends = [
  { month: 'Sep', deposits: 2500000, withdrawals: 1800000 },
  { month: 'Oct', deposits: 2700000, withdrawals: 2000000 },
  { month: 'Nov', deposits: 2900000, withdrawals: 2100000 },
  { month: 'Dec', deposits: 3200000, withdrawals: 2300000 },
  { month: 'Jan', deposits: 3000000, withdrawals: 2200000 },
  { month: 'Feb', deposits: 3400000, withdrawals: 2500000 },
];

export default function ManagerDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Executive overview and analytics</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi) => (
              <Card key={kpi.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${kpi.color} rounded-xl flex items-center justify-center`}>
                    <kpi.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-sm font-semibold ${
                    kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
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
            {/* Monthly Revenue Chart */}
            <Card className="p-6 rounded-2xl bg-white border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                  />
                  <Bar dataKey="revenue" fill="#0066FF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Loan Distribution Chart */}
            <Card className="p-6 rounded-2xl bg-white border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Transaction Trends Chart */}
          <Card className="p-6 rounded-2xl bg-white border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value: number) => `₹${(value / 100000).toFixed(1)}L`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="deposits" stroke="#00C853" strokeWidth={2} />
                <Line type="monotone" dataKey="withdrawals" stroke="#FF6D00" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
