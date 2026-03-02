import { StaffSidebar } from '../../components/StaffSidebar';
import { Card } from '../../components/ui/card';
import { TrendingUp, Users, FileText, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyStats = [
  { month: 'Sep', processed: 45, approved: 38 },
  { month: 'Oct', processed: 52, approved: 43 },
  { month: 'Nov', processed: 48, approved: 40 },
  { month: 'Dec', processed: 55, approved: 47 },
  { month: 'Jan', processed: 50, approved: 42 },
  { month: 'Feb', processed: 58, approved: 51 },
];

export default function StaffReports() {
  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Performance metrics and analytics</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <Card className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Loan Processing</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }} />
                <Bar dataKey="processed" fill="#AA00FF" radius={[8, 8, 0, 0]} name="Processed" />
                <Bar dataKey="approved" fill="#00C853" radius={[8, 8, 0, 0]} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
