import { StaffSidebar } from '../../components/StaffSidebar';
import { Card } from '../../components/ui/card';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

const stats = [
  { label: 'Total Customers', value: '1,245', icon: Users, color: 'bg-blue-500', change: '+12%' },
  { label: 'Pending Loans', value: '23', icon: Clock, color: 'bg-orange-500', change: '+3' },
  { label: 'Approved Today', value: '8', icon: CheckCircle, color: 'bg-green-500', change: '+2' },
  { label: 'Active Accounts', value: '1,189', icon: FileText, color: 'bg-purple-500', change: '+8%' },
];

const recentLoans = [
  { id: 'L001', customer: 'Priya Sharma', amount: 500000, type: 'Personal Loan', status: 'Pending', date: '2026-03-02' },
  { id: 'L002', customer: 'Arjun Patel', amount: 1000000, type: 'Home Loan', status: 'Pending', date: '2026-03-02' },
  { id: 'L003', customer: 'Ananya Singh', amount: 250000, type: 'Business Loan', status: 'Under Review', date: '2026-03-01' },
  { id: 'L004', customer: 'Rahul Kumar', amount: 750000, type: 'Car Loan', status: 'Pending', date: '2026-03-01' },
  { id: 'L005', customer: 'Kavya Menon', amount: 300000, type: 'Personal Loan', status: 'Pending', date: '2026-02-28' },
];

export default function StaffDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Staff Member</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6 rounded-2xl bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Recent Loan Applications */}
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
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{loan.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{loan.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          loan.status === 'Pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
