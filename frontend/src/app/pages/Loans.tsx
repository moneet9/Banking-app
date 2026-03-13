import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Info } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { applyLoan, getLoanRates, type LoanType } from '../services/bankingApi';

const loanTypeOptions: Array<{ value: LoanType; label: string; defaultRate: number }> = [
  { value: 'personal', label: 'Personal Loan', defaultRate: 8.5 },
  { value: 'home', label: 'Home Loan', defaultRate: 6.5 },
  { value: 'auto', label: 'Auto Loan', defaultRate: 7.2 },
  { value: 'business', label: 'Business Loan', defaultRate: 9.5 },
];

const defaultRateMap: Record<LoanType, number> = {
  personal: 8.5,
  home: 6.5,
  auto: 7.2,
  business: 9.5,
};

const amountPresets = [
  { value: 100000, label: '1 Lakh' },
  { value: 500000, label: '5 Lakh' },
  { value: 2500000, label: '25 Lakh' },
  { value: 10000000, label: '1 Crore' },
];

const tenurePresets = [6, 12, 24, 36, 60];

export default function Loans() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('personal');
  const [tenure, setTenure] = useState('12');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loanRates, setLoanRates] = useState<Record<LoanType, number>>(defaultRateMap);

  useEffect(() => {
    const loadRates = async () => {
      try {
        const data = await getLoanRates();
        const next = { ...defaultRateMap };
        data.forEach((item) => {
          next[item.loanType] = item.rate;
        });
        setLoanRates(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load latest loan rates');
      }
    };

    loadRates();
  }, []);

  const loanTypes = loanTypeOptions.map((option) => ({
    value: option.value,
    label: option.label,
    rate: loanRates[option.value] ?? option.defaultRate,
  }));

  const selectedLoan = loanTypes.find((l) => l.value === loanType);
  const amountValue = Number(amount);
  const tenureValue = Number(tenure);
  const monthlyPayment = amountValue > 0 && tenureValue > 0
    ? (amountValue * (selectedLoan?.rate || 8.5) / 100 / 12 + amountValue / tenureValue).toFixed(2)
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await applyLoan({
        loanType,
        amount: Number(amount),
        tenureMonths: Number(tenure),
      });
      toast.success('Loan application submitted successfully!');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Loan submission failed');
      if (error instanceof Error && /auth|token|unauthorized/i.test(error.message)) {
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Apply for Loan</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Info Card */}
        <Card className="bg-white border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-[#2563EB] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#2563EB] mb-1">Quick & Easy Approval</p>
              <p className="text-xs text-gray-700">Get instant pre-approval and funds in your account within 24 hours</p>
            </div>
          </div>
        </Card>

        {/* Application Form */}
        <Card className="bg-white rounded-3xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loan Type */}
            <div className="space-y-2">
              <Label htmlFor="loanType" className="text-gray-700">Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger className="h-14 bg-[#E2E8F0] border-slate-300 rounded-xl">
                  <SelectValue placeholder="Select loan type" />
                </SelectTrigger>
                <SelectContent>
                  {loanTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700">Loan Amount</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 bg-[#E2E8F0] border-slate-300 rounded-xl pl-10 text-2xl font-semibold"
                  step="1000"
                  min="50000"
                  max="100000000"
                  required
                />
              </div>
              <div className="flex gap-2 mt-2">
                {amountPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAmount(preset.value.toString())}
                    className="px-3 py-2 bg-blue-50 text-[#2563EB] rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    ₹{preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <Label htmlFor="tenure" className="text-gray-700">Loan Tenure (Months)</Label>
              <Input
                id="tenure"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="h-14 bg-[#E2E8F0] border-slate-300 rounded-xl"
                min="1"
                max="480"
                placeholder="Enter custom months"
                required
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {tenurePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTenure(preset.toString())}
                    className="px-3 py-2 bg-blue-50 text-[#2563EB] rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    {preset} Months
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate Display */}
            <Card className="bg-white border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Interest Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedLoan?.rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            {/* Summary */}
            <div className="bg-white border border-blue-100 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 mb-2">Loan Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Principal Amount</span>
                  <span className="font-semibold text-gray-900">₹{amount ? parseFloat(amount).toLocaleString('en-IN') : '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Interest Rate</span>
                  <span className="font-semibold text-gray-900">{selectedLoan?.rate}% p.a.</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tenure</span>
                  <span className="font-semibold text-gray-900">{tenure} months</span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Monthly Payment</span>
                  <span className="font-bold text-[#2563EB] text-lg">₹{parseFloat(monthlyPayment).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-xl font-semibold shadow-lg shadow-blue-300/40"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}