import { useState } from 'react';
import { StaffSidebar } from '../../components/StaffSidebar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStaffAccounts,
  getStaffCashRequests,
  approveStaffCashRequest,
  rejectStaffCashRequest,
  type CashRequestItem,
  type StaffCustomerAccount,
} from '../../services/bankingApi';
import { useEffect } from 'react';

export default function StaffAccounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<StaffCustomerAccount[]>([]);
  const [requests, setRequests] = useState<CashRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestLoading, setIsRequestLoading] = useState(true);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const items = await getStaffAccounts(searchTerm);
        setAccounts(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRequests = async () => {
    try {
      setIsRequestLoading(true);
      const items = await getStaffCashRequests('pending');
      setRequests(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load requests');
    } finally {
      setIsRequestLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId);
      await approveStaffCashRequest(requestId);
      toast.success('Request approved');
      await Promise.all([
        loadRequests(),
        (async () => {
          const refreshed = await getStaffAccounts(searchTerm);
          setAccounts(refreshed);
        })(),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Approval failed');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId);
      await rejectStaffCashRequest(requestId);
      toast.success('Request rejected');
      await loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reject failed');
    } finally {
      setProcessingRequestId(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Customer Accounts</h1>
          <p className="text-gray-600 mt-1">Manage and monitor customer accounts</p>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, account ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Accounts Table */}
          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Account Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Member Since</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Loading accounts...</td>
                    </tr>
                  )}
                  {!isLoading && accounts.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>No customer accounts found.</td>
                    </tr>
                  )}
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 align-top">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{account.accountNumber}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{account.fullName}</p>
                          <p className="text-xs text-gray-500">{account.email}</p>
                          <p className="text-xs text-gray-500">{account.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(account.memberSince).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-200 mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Pending Deposit/Withdrawal Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Requested At</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isRequestLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Loading requests...</td>
                    </tr>
                  )}
                  {!isRequestLoading && requests.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>No pending requests.</td>
                    </tr>
                  )}
                  {requests.map((item) => {
                    const customer = typeof item.userId === 'string' ? null : item.userId;
                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{customer?.fullName || 'Customer'}</p>
                          <p className="text-xs text-gray-500">{customer?.accountNumber || ''}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 capitalize">{item.type}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(item.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(item._id)}
                              disabled={processingRequestId === item._id}
                              className="h-9 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleReject(item._id)}
                              disabled={processingRequestId === item._id}
                              className="h-9 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
