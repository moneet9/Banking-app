import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { StaffSidebar } from '../../components/StaffSidebar';
import { Card } from '../../components/ui/card';
import { getStaffDashboard, type StaffDashboardData } from '../../services/bankingApi';

const emptyData: StaffDashboardData = {
  role: 'staff',
  customerCount: 0,
  pendingLoans: 0,
  approvedLoans: 0,
  rejectedLoans: 0,
  totalLoans: 0,
  activeAccounts: 0,
  approvalRate: 0,
  monthlyLoanStats: [],
  recentLoans: [],
};

function formatStatus(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') {
    return 'Approved';
  }
  if (status === 'rejected') {
    return 'Rejected';
  }
  return 'Pending';
}

function statusClass(status: 'pending' | 'approved' | 'rejected') {
  if (status === 'approved') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'rejected') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-orange-100 text-orange-700';
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<StaffDashboardData>(emptyData);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await getStaffDashboard();
        setDashboard(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
        navigate('/staff/login');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Customers',
        value: dashboard.customerCount.toLocaleString('en-IN'),
        icon: Users,
        color: 'bg-blue-500',
        helper: `${dashboard.activeAccounts.toLocaleString('en-IN')} active accounts`,
      },
      {
        label: 'Pending Loans',
        value: dashboard.pendingLoans.toLocaleString('en-IN'),
        icon: Clock,
        color: 'bg-orange-500',
        helper: `${dashboard.totalLoans.toLocaleString('en-IN')} total applications`,
      },
      {
        label: 'Approved Loans',
        value: dashboard.approvedLoans.toLocaleString('en-IN'),
        icon: CheckCircle,
        color: 'bg-green-500',
        helper: `${dashboard.approvalRate.toFixed(1)}% approval rate`,
      },
      {
        label: 'Rejected Loans',
        value: dashboard.rejectedLoans.toLocaleString('en-IN'),
        icon: FileText,
        color: 'bg-purple-500',
        helper: `${Math.max(100 - dashboard.approvalRate, 0).toFixed(1)}% non-approval rate`,
      },
    ],
    [dashboard]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Operational performance and loan processing activity</p>
        </div>

        <div className="p-8">
          {isLoading && <p className="text-sm text-gray-600 mb-4">Loading staff dashboard...</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.helper}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Loan Processing</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={dashboard.monthlyLoanStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }} />
                  <Legend />
                  <Bar dataKey="processed" fill="#6366F1" radius={[8, 8, 0, 0]} name="Processed" />
                  <Bar dataKey="approved" fill="#10B981" radius={[8, 8, 0, 0]} name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Decision Snapshot</h2>
              <div className="space-y-4">
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Approval Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard.approvalRate.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Pending Review Share</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {dashboard.totalLoans > 0 ? ((dashboard.pendingLoans / dashboard.totalLoans) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Current Open Queue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboard.pendingLoans.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Loan Applications</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Loan ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{loan.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{loan.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass(loan.status)}`}>
                          {formatStatus(loan.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.date}</td>
                    </tr>
                  ))}
                  {!dashboard.recentLoans.length && !isLoading && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                        No loan applications found yet.
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
  );
}
