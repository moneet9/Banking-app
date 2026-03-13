import { ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { getMyPassbook } from '../services/bankingApi';
import { toast } from 'sonner';

export default function Transactions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<Array<{
    _id: string;
    name: string;
    amount: number;
    timestamp: string;
    type: 'credit' | 'debit';
    category: string;
    openingBalance: number;
    closingBalance: number;
  }>>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const payload = await getMyPassbook(searchQuery);
        setEntries(payload.entries);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load passbook');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { income, expenses, groupedEntries } = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const monthEntries = entries.filter(
      (item) => new Date(item.timestamp).getTime() >= monthStart.getTime()
    );

    const incomeTotal = monthEntries
      .filter((item) => item.type === 'credit')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenseTotal = monthEntries
      .filter((item) => item.type === 'debit')
      .reduce((sum, item) => sum + item.amount, 0);

    const groups = entries.reduce<Record<string, typeof entries>>((acc, item) => {
      const key = new Date(item.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' });
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const grouped = Object.entries(groups).map(([date, groupedItems]) => ({
      date,
      entries: groupedItems,
    }));

    return {
      income: incomeTotal,
      expenses: expenseTotal,
      groupedEntries: grouped,
    };
  }, [entries]);

  const formatAmount = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Passbook</h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search passbook entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-12 bg-[#E2E8F0] border-slate-300 rounded-xl text-gray-800 placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Monthly Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-white border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Income</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatAmount(income)}</p>
            <p className="text-xs text-green-600 mt-1">This month</p>
          </Card>
          <Card className="bg-white border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">Expenses</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{formatAmount(expenses)}</p>
            <p className="text-xs text-orange-600 mt-1">This month</p>
          </Card>
        </div>

        {/* Passbook List */}
        <div className="space-y-6">
          {isLoading && <p className="text-sm text-gray-500">Loading passbook...</p>}
          {!isLoading && groupedEntries.length === 0 && (
            <p className="text-sm text-gray-500">No passbook entries found.</p>
          )}
          {groupedEntries.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">{group.date}</h2>
              </div>
              <div className="space-y-2">
                {group.entries.map((entry) => (
                  <Card 
                    key={entry._id} 
                    className="p-4 rounded-2xl bg-white hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                          {entry.type === 'credit' ? '💰' : '💸'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{entry.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{entry.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Opening {formatAmount(entry.openingBalance)} | Closing {formatAmount(entry.closingBalance)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          entry.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {entry.type === 'credit' ? '+' : '-'}{formatAmount(Math.abs(entry.amount))}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}