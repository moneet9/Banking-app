import { ArrowUpRight, ArrowDownLeft, CreditCard, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDashboard } from '../services/bankingApi';
import { toast } from 'sonner';

const quickActions = [
  { icon: ArrowDownLeft, label: 'Deposit', color: 'bg-green-500', route: '/cash-requests?type=deposit' },
  { icon: ArrowUpRight, label: 'Withdraw', color: 'bg-orange-500', route: '/cash-requests?type=withdrawal' },
  { icon: CreditCard, label: 'Transfer', color: 'bg-blue-500', route: '/transfer' },
  { icon: FileText, label: 'Loans', color: 'bg-purple-500', route: '/loans' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('Customer');
  const [balance, setBalance] = useState(0);
  const [thisMonthNet, setThisMonthNet] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Array<{
    _id: string;
    name: string;
    amount: number;
    timestamp: string;
    type: 'credit' | 'debit';
    category: string;
  }>>([]);

  const thisMonthNetLabel = useMemo(() => {
    const sign = thisMonthNet >= 0 ? '+' : '-';
    return `${sign}₹${Math.abs(thisMonthNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  }, [thisMonthNet]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboard();
        setUserName(data.user.fullName);
        setBalance(data.balance);
        setThisMonthNet(data.thisMonthNet);
        setRecentTransactions(data.recentTransactions);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load dashboard');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066FF] to-[#004FCC] pt-12 pb-32 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-100 text-sm mb-1">Welcome back,</p>
              <h1 className="text-2xl font-bold text-white">{userName}</h1>
            </div>
            <button 
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              onClick={() => navigate('/profile')}
            >
              <span className="text-2xl">👤</span>
            </button>
          </div>
        </div>
      </div>

      {/* Balance Card - Overlapping */}
      <div className="max-w-2xl mx-auto px-4 -mt-24">
        <Card className="bg-white rounded-3xl shadow-2xl p-6 mb-6 relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-60" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Balance</p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-gray-900">
                {showBalance ? `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '••••••'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-semibold">{thisMonthNetLabel}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white transition-colors"
                onClick={() => navigate(action.route)}
              >
                <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <button 
              className="text-sm text-[#0066FF] font-medium"
              onClick={() => navigate('/passbook')}
            >
              See All
            </button>
          </div>
          <div className="space-y-3">
            {isLoading && <p className="text-sm text-gray-500 px-1">Loading transactions...</p>}
            {recentTransactions.map((transaction) => (
              <Card key={transaction._id} className="p-4 rounded-2xl bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.name}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.category}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}