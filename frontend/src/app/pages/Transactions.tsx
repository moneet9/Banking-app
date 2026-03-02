import { ArrowLeft, Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { getTransactions } from '../services/bankingApi';
import { toast } from 'sonner';

export default function Transactions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Array<{
    _id: string;
    name: string;
    amount: number;
    timestamp: string;
    type: 'credit' | 'debit';
    category: string;
  }>>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const items = await getTransactions(searchQuery);
        setTransactions(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { income, expenses, groupedTransactions } = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const monthTransactions = transactions.filter(
      (item) => new Date(item.timestamp).getTime() >= monthStart.getTime()
    );

    const incomeTotal = monthTransactions
      .filter((item) => item.type === 'credit')
      .reduce((sum, item) => sum + item.amount, 0);

    const expenseTotal = monthTransactions
      .filter((item) => item.type === 'debit')
      .reduce((sum, item) => sum + item.amount, 0);

    const groups = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
      const key = new Date(tx.timestamp).toLocaleDateString('en-IN', { dateStyle: 'medium' });
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(tx);
      return acc;
    }, {});

    const grouped = Object.entries(groups).map(([date, groupedItems]) => ({
      date,
      transactions: groupedItems,
    }));

    return {
      income: incomeTotal,
      expenses: expenseTotal,
      groupedTransactions: grouped,
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066FF] to-[#004FCC] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Transactions</h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 pr-12 bg-white/20 backdrop-blur-md border-white/30 rounded-xl text-white placeholder:text-white/60"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Monthly Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-green-50 border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Income</span>
            </div>
            <p className="text-2xl font-bold text-green-700">₹{income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-600 mt-1">This month</p>
          </Card>
          <Card className="bg-orange-50 border-orange-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">Expenses</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">₹{expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-orange-600 mt-1">This month</p>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
          {isLoading && <p className="text-sm text-gray-500">Loading transactions...</p>}
          {!isLoading && groupedTransactions.length === 0 && (
            <p className="text-sm text-gray-500">No transactions found.</p>
          )}
          {groupedTransactions.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">{group.date}</h2>
              </div>
              <div className="space-y-2">
                {group.transactions.map((transaction) => (
                  <Card 
                    key={transaction._id} 
                    className="p-4 rounded-2xl bg-white hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                          {transaction.type === 'credit' ? '💰' : '💸'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{transaction.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <button className="w-full py-3 text-center text-sm text-[#0066FF] font-medium hover:underline mt-4">
          Load More Transactions
        </button>
      </div>
    </div>
  );
}