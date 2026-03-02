import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { createCashRequest, getMyCashRequests, type CashRequestItem } from '../services/bankingApi';
import { toast } from 'sonner';

export default function CashRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryType = new URLSearchParams(location.search).get('type');
  const initialType = queryType === 'withdrawal' ? 'withdrawal' : 'deposit';

  const [type, setType] = useState<'deposit' | 'withdrawal'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<CashRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const items = await getMyCashRequests();
      setRequests(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      await createCashRequest(type, numericAmount, note || undefined);
      toast.success('Request sent to staff for approval');
      setAmount('');
      setNote('');
      await loadRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-[#0066FF] to-[#004FCC] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Cash Request</h1>
          </div>
          <p className="text-blue-100 text-sm">Submit deposit/withdrawal request for staff approval</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="bg-white rounded-3xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setType('deposit')}
                className={type === 'deposit' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Deposit Request
              </Button>
              <Button
                type="button"
                onClick={() => setType('withdrawal')}
                className={type === 'withdrawal' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Withdraw Request
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                type="text"
                placeholder="Add request note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white">
              {isSubmitting ? 'Sending...' : 'Send Request to Staff'}
            </Button>
          </form>
        </Card>

        <Card className="bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">My Requests</h2>
          {isLoading && <p className="text-sm text-gray-500">Loading requests...</p>}
          {!isLoading && requests.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
          <div className="space-y-3">
            {requests.map((item) => (
              <div key={item._id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 capitalize">{item.type}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    item.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
