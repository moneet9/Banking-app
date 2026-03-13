import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  getManagerCustomerPassbook,
  getManagerCustomers,
  type PassbookEntry,
  type StaffCustomerAccount,
} from '../../services/bankingApi';

function formatAmount(value: number) {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function ManagerPassbookLogs() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<StaffCustomerAccount[]>([]);
  const [isCustomersLoading, setIsCustomersLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState<StaffCustomerAccount | null>(null);
  const [passbookSearch, setPassbookSearch] = useState('');
  const [passbookEntries, setPassbookEntries] = useState<PassbookEntry[]>([]);
  const [isPassbookLoading, setIsPassbookLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsCustomersLoading(true);
        const items = await getManagerCustomers(customerSearch);
        setCustomers(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load customers');
      } finally {
        setIsCustomersLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const loadPassbook = async (customerId: string, query: string) => {
    try {
      setIsPassbookLoading(true);
      const payload = await getManagerCustomerPassbook(customerId, query);
      setPassbookEntries(payload.entries);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load passbook');
    } finally {
      setIsPassbookLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: StaffCustomerAccount) => {
    setSelectedCustomer(customer);
    await loadPassbook(customer.id, passbookSearch);
  };

  useEffect(() => {
    if (!selectedCustomer) {
      return;
    }

    const timer = setTimeout(() => {
      loadPassbook(selectedCustomer.id, passbookSearch);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCustomer, passbookSearch]);

  const customerHeader = useMemo(() => {
    if (!selectedCustomer) {
      return 'Select a customer to view passbook';
    }

    return `${selectedCustomer.fullName} (${selectedCustomer.accountNumber})`;
  }, [selectedCustomer]);

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Customer Passbook Logs</h1>
          <p className="text-gray-600 mt-1">Select a customer and inspect passbook entries</p>
        </div>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
          <Card className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
              {isCustomersLoading && <p className="text-sm text-gray-500">Loading customers...</p>}
              {!isCustomersLoading && customers.length === 0 && (
                <p className="text-sm text-gray-500">No customer found.</p>
              )}
              {customers.map((customer) => {
                const isActive = selectedCustomer?.id === customer.id;
                return (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      isActive
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{customer.fullName}</p>
                    <p className="text-xs text-gray-500">{customer.accountNumber}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{customerHeader}</h2>
              {selectedCustomer && (
                <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                  <span>Email: {selectedCustomer.email}</span>
                  <span>Balance: {formatAmount(selectedCustomer.balance)}</span>
                </div>
              )}

              <div className="relative mt-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search passbook entries..."
                  value={passbookSearch}
                  onChange={(event) => setPassbookSearch(event.target.value)}
                  className="pl-10 h-11 rounded-xl"
                  disabled={!selectedCustomer}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Particulars</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Opening</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!selectedCustomer && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                        Select a customer from left panel.
                      </td>
                    </tr>
                  )}
                  {selectedCustomer && isPassbookLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                        Loading passbook...
                      </td>
                    </tr>
                  )}
                  {selectedCustomer && !isPassbookLoading && passbookEntries.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={6}>
                        No passbook entries found.
                      </td>
                    </tr>
                  )}
                  {passbookEntries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(entry.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-gray-500">{entry.category}</p>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-700">{entry.type}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${entry.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'credit' ? '+' : '-'}{formatAmount(Math.abs(entry.amount))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatAmount(entry.openingBalance)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formatAmount(entry.closingBalance)}</td>
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
