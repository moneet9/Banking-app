import { useState } from 'react';
import { StaffSidebar } from '../../components/StaffSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

const loanApplications = [
  { 
    id: 'L001', 
    customer: 'Priya Sharma', 
    email: 'priya@example.com',
    amount: 500000, 
    type: 'Personal Loan', 
    tenure: 24,
    status: 'Pending', 
    date: '2026-03-02',
    income: 750000,
    creditScore: 720
  },
  { 
    id: 'L002', 
    customer: 'Arjun Patel', 
    email: 'arjun@example.com',
    amount: 1000000, 
    type: 'Home Loan', 
    tenure: 120,
    status: 'Pending', 
    date: '2026-03-02',
    income: 1200000,
    creditScore: 750
  },
  { 
    id: 'L003', 
    customer: 'Ananya Singh', 
    email: 'ananya@example.com',
    amount: 250000, 
    type: 'Business Loan', 
    tenure: 36,
    status: 'Under Review', 
    date: '2026-03-01',
    income: 900000,
    creditScore: 680
  },
  { 
    id: 'L004', 
    customer: 'Rahul Kumar', 
    email: 'rahul@example.com',
    amount: 750000, 
    type: 'Car Loan', 
    tenure: 60,
    status: 'Pending', 
    date: '2026-03-01',
    income: 850000,
    creditScore: 710
  },
  { 
    id: 'L005', 
    customer: 'Kavya Menon', 
    email: 'kavya@example.com',
    amount: 300000, 
    type: 'Personal Loan', 
    tenure: 18,
    status: 'Pending', 
    date: '2026-02-28',
    income: 650000,
    creditScore: 695
  },
];

export default function StaffLoans() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<typeof loanApplications[0] | null>(null);

  const filteredLoans = loanApplications.filter(loan =>
    loan.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = (loanId: string) => {
    toast.success(`Loan ${loanId} approved and forwarded to manager`);
    setSelectedLoan(null);
  };

  const handleReject = (loanId: string) => {
    toast.error(`Loan ${loanId} rejected`);
    setSelectedLoan(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Loan Applications</h1>
          <p className="text-gray-600 mt-1">Review and manage pending loan applications</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer name or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Loans Table */}
          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Loan ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Credit Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{loan.customer}</p>
                          <p className="text-xs text-gray-500">{loan.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{loan.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.type}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          loan.creditScore >= 700
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {loan.creditScore}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          loan.status === 'Pending'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => setSelectedLoan(loan)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Loan Application Review</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Loan ID</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.customer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                <p className="text-lg font-semibold text-gray-900">₹{selectedLoan.amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Loan Type</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tenure</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.tenure} months</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Annual Income</p>
                <p className="text-lg font-semibold text-gray-900">₹{selectedLoan.income.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Score</p>
                <p className={`text-lg font-semibold ${
                  selectedLoan.creditScore >= 700 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {selectedLoan.creditScore}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Application Date</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.date}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={() => handleApprove(selectedLoan.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl h-12"
              >
                Approve & Forward to Manager
              </Button>
              <Button
                onClick={() => handleReject(selectedLoan.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12"
              >
                Reject
              </Button>
              <Button
                onClick={() => setSelectedLoan(null)}
                variant="outline"
                className="px-6 rounded-xl h-12"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
