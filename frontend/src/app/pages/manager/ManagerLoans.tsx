import { useEffect, useState } from 'react';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, CheckCircle, XCircle, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  getManagerLoanRates,
  updateManagerLoanRates,
  type LoanRateItem,
  type LoanType,
} from '../../services/bankingApi';

const pendingLoans = [
  { 
    id: 'L001', 
    customer: 'Priya Sharma', 
    email: 'priya@example.com',
    amount: 500000, 
    type: 'Personal Loan', 
    tenure: 24,
    status: 'Staff Approved', 
    staffApprovedBy: 'John Staff',
    date: '2026-03-02',
    income: 750000,
    creditScore: 720,
    employmentType: 'Salaried',
    company: 'Tech Solutions Pvt Ltd'
  },
  { 
    id: 'L002', 
    customer: 'Arjun Patel', 
    email: 'arjun@example.com',
    amount: 1000000, 
    type: 'Home Loan', 
    tenure: 120,
    status: 'Staff Approved', 
    staffApprovedBy: 'Jane Staff',
    date: '2026-03-02',
    income: 1200000,
    creditScore: 750,
    employmentType: 'Self-Employed',
    company: 'Patel Trading Co'
  },
  { 
    id: 'L006', 
    customer: 'Vikram Reddy', 
    email: 'vikram@example.com',
    amount: 2000000, 
    type: 'Business Loan', 
    tenure: 60,
    status: 'Staff Approved', 
    staffApprovedBy: 'John Staff',
    date: '2026-03-01',
    income: 1500000,
    creditScore: 730,
    employmentType: 'Business Owner',
    company: 'Reddy Enterprises'
  },
];

const loanTypeLabels: Record<LoanType, string> = {
  personal: 'Personal Loan',
  home: 'Home Loan',
  auto: 'Auto Loan',
  business: 'Business Loan',
};

const defaultRateState: Record<LoanType, string> = {
  personal: '8.5',
  home: '6.5',
  auto: '7.2',
  business: '9.5',
};

function normalizeRateState(items: LoanRateItem[]) {
  const next = { ...defaultRateState };

  items.forEach((item) => {
    next[item.loanType] = String(item.rate);
  });

  return next;
}

export default function ManagerLoans() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<typeof pendingLoans[0] | null>(null);
  const [loanRates, setLoanRates] = useState<Record<LoanType, string>>(defaultRateState);
  const [isRatesLoading, setIsRatesLoading] = useState(true);
  const [isSavingRates, setIsSavingRates] = useState(false);

  useEffect(() => {
    const loadLoanRates = async () => {
      try {
        setIsRatesLoading(true);
        const data = await getManagerLoanRates();
        setLoanRates(normalizeRateState(data));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load loan rates');
      } finally {
        setIsRatesLoading(false);
      }
    };

    loadLoanRates();
  }, []);

  const filteredLoans = pendingLoans.filter(loan =>
    loan.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFinalApprove = (loanId: string) => {
    toast.success(`Loan ${loanId} finally approved! Funds will be disbursed.`);
    setSelectedLoan(null);
  };

  const handleReject = (loanId: string) => {
    toast.error(`Loan ${loanId} rejected by manager`);
    setSelectedLoan(null);
  };

  const handleRateInputChange = (loanType: LoanType, value: string) => {
    setLoanRates((prev) => ({
      ...prev,
      [loanType]: value,
    }));
  };

  const handleSaveRates = async () => {
    try {
      const payload = (Object.keys(loanTypeLabels) as LoanType[]).reduce(
        (acc, loanType) => {
          const numericRate = Number(loanRates[loanType]);

          if (!Number.isFinite(numericRate) || numericRate <= 0 || numericRate > 100) {
            throw new Error(`${loanTypeLabels[loanType]} must be a valid rate between 0 and 100`);
          }

          acc[loanType] = Number(numericRate.toFixed(2));
          return acc;
        },
        {} as Record<LoanType, number>
      );

      setIsSavingRates(true);
      const updated = await updateManagerLoanRates(payload);
      setLoanRates(normalizeRateState(updated));
      toast.success('Loan interest rates updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update rates');
    } finally {
      setIsSavingRates(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Final Loan Approvals</h1>
          <p className="text-gray-600 mt-1">Review staff-approved loan applications for final decision</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <Card className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Loan Interest Rate Settings
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  These rates are applied to all new customer loan applications.
                </p>
              </div>
              <Button
                onClick={handleSaveRates}
                disabled={isRatesLoading || isSavingRates}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                {isSavingRates ? 'Saving...' : 'Save Rates'}
              </Button>
            </div>

            {isRatesLoading && <p className="text-sm text-gray-500 mb-4">Loading loan rates...</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(loanTypeLabels) as LoanType[]).map((loanType) => (
                <div key={loanType}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{loanTypeLabels[loanType]}</label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={loanRates[loanType]}
                      onChange={(event) => handleRateInputChange(loanType, event.target.value)}
                      className="pr-16 rounded-xl"
                      disabled={isRatesLoading || isSavingRates}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                      % p.a.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Approved By</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600">{loan.staffApprovedBy}</td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => setSelectedLoan(loan)}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
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

      {/* Final Review Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Loan Approval Review</h2>
            
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
                <p className="text-sm text-gray-600 mb-1">Employment Type</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.employmentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Company</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Staff Approved By</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLoan.staffApprovedBy}</p>
              </div>
            </div>

            {/* Staff Approval Badge */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-700 font-medium">✓ Staff Verified & Approved</p>
              <p className="text-xs text-blue-600 mt-1">This loan has passed initial staff review and is ready for final approval</p>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                onClick={() => handleFinalApprove(selectedLoan.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Final Approve & Disburse
              </Button>
              <Button
                onClick={() => handleReject(selectedLoan.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-semibold"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setSelectedLoan(null)}
                variant="outline"
                className="px-8 rounded-xl h-12"
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
