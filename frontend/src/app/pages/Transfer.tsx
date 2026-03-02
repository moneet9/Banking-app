import { useState } from 'react';
import { ArrowLeft, User, DollarSign, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { createTransfer } from '../services/bankingApi';

const recentRecipients = [
  { id: 1, name: 'Priya Sharma', email: 'priya@example.com', avatar: '👩' },
  { id: 2, name: 'Arjun Patel', email: 'arjun@example.com', avatar: '👨' },
  { id: 3, name: 'Ananya Singh', email: 'ananya@example.com', avatar: '👩' },
];

export default function Transfer() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await createTransfer(recipient, Number(amount), note || undefined);
      toast.success('Transfer completed successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Transfer failed');
      if (error instanceof Error && /auth|token|unauthorized/i.test(error.message)) {
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0066FF] to-[#004FCC] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Transfer Money</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Recent Recipients */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">Recent Recipients</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentRecipients.map((person) => (
              <button
                key={person.id}
                onClick={() => setRecipient(person.email)}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                  {person.avatar}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">{person.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transfer Form */}
        <Card className="bg-white rounded-3xl shadow-xl p-6">
          <form onSubmit={handleTransfer} className="space-y-6">
            {/* Recipient */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Recipient
              </Label>
              <Input
                id="recipient"
                type="email"
                placeholder="Enter email or phone number"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-14 bg-gray-50 border-gray-200 rounded-xl"
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 bg-gray-50 border-gray-200 rounded-xl pl-10 text-2xl font-semibold"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-2 mt-2">
                {[500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset.toString())}
                    className="px-4 py-2 bg-blue-50 text-[#0066FF] rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note" className="text-gray-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Note (Optional)
              </Label>
              <Input
                id="note"
                type="text"
                placeholder="Add a message"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-14 bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transfer Amount</span>
                <span className="font-semibold text-gray-900">₹{amount || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction Fee</span>
                <span className="font-semibold text-green-600">₹0.00</span>
              </div>
              <div className="h-px bg-gray-200 my-2" />
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-[#0066FF] text-lg">₹{amount || '0.00'}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}