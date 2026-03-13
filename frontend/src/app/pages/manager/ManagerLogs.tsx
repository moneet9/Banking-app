import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { ManagerSidebar } from '../../components/ManagerSidebar';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  getManagerPassbookLogs,
  getManagerStaffActivityLogs,
  type ManagerPassbookLogItem,
  type StaffActivityLogItem,
} from '../../services/bankingApi';

function formatAmount(value: number) {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function toActionLabel(action: string) {
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ManagerLogs() {
  const [passbookSearch, setPassbookSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  const [passbookLogs, setPassbookLogs] = useState<ManagerPassbookLogItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<StaffActivityLogItem[]>([]);

  const [isPassbookLoading, setIsPassbookLoading] = useState(true);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsPassbookLoading(true);
        const items = await getManagerPassbookLogs(passbookSearch);
        setPassbookLogs(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load passbook logs');
      } finally {
        setIsPassbookLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [passbookSearch]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsActivityLoading(true);
        const items = await getManagerStaffActivityLogs(activitySearch);
        setActivityLogs(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load staff activity logs');
      } finally {
        setIsActivityLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activitySearch]);

  const summary = useMemo(
    () => ({
      totalPassbookLogs: passbookLogs.length,
      totalActivityLogs: activityLogs.length,
    }),
    [passbookLogs.length, activityLogs.length]
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Passbook And Activity Logs</h1>
          <p className="text-gray-600 mt-1">Monitor customer passbook entries and all staff actions</p>
          <div className="mt-3 text-sm text-gray-500 flex gap-6">
            <span>Passbook logs: {summary.totalPassbookLogs}</span>
            <span>Staff activity logs: {summary.totalActivityLogs}</span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Customer Passbook Logs</h2>
              <p className="text-sm text-gray-600 mt-1">Search by customer name, account number, transaction, or category</p>
              <div className="relative mt-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search passbook logs..."
                  value={passbookSearch}
                  onChange={(event) => setPassbookSearch(event.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Entry</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isPassbookLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Loading passbook logs...</td>
                    </tr>
                  )}
                  {!isPassbookLoading && passbookLogs.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>No passbook logs found.</td>
                    </tr>
                  )}
                  {passbookLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.timestamp).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-medium">{item.customer.fullName}</p>
                        <p className="text-xs text-gray-500">{item.customer.accountNumber}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-700">{item.type}</td>
                      <td className={`px-6 py-4 text-sm font-semibold ${item.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'credit' ? '+' : '-'}{formatAmount(Math.abs(item.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Staff Employee Activity Logs</h2>
              <p className="text-sm text-gray-600 mt-1">Search by staff, customer, action, or description</p>
              <div className="relative mt-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activity logs..."
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  className="pl-10 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isActivityLoading && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>Loading activity logs...</td>
                    </tr>
                  )}
                  {!isActivityLoading && activityLogs.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-gray-500" colSpan={5}>No staff activity logs found.</td>
                    </tr>
                  )}
                  {activityLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(item.createdAt).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-medium">{item.actor?.fullName || 'Unknown staff'}</p>
                        <p className="text-xs text-gray-500">{item.actor?.email || ''}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{toActionLabel(item.action)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <p className="font-medium">{item.target?.fullName || '-'}</p>
                        <p className="text-xs text-gray-500">{item.target?.accountNumber || ''}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.description}</td>
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
