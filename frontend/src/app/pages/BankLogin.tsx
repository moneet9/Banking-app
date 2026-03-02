import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { clearSession, login, saveSession } from '../services/bankingApi';

export default function BankLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const result = await login(email, password);

      if (result.user.role !== 'customer') {
        clearSession();
        toast.error('This login is only for customers. Use staff/manager login.');
        return;
      }

      saveSession(result.token, result.user);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0066FF] to-[#004FCC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-blue-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to role selection
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-3xl font-bold text-[#0066FF]">₹</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SecureBank</h1>
          <p className="text-blue-100">Customer Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Welcome Back</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                Remember me
              </label>
              <button type="button" className="text-[#0066FF] font-medium hover:underline">
                Forgot Password?
              </button>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button className="text-[#0066FF] font-semibold hover:underline">
              Sign Up
            </button>
          </div>
        </div>

        <p className="text-center text-blue-100 text-xs mt-6">
          Secured by 256-bit encryption
        </p>
      </div>
    </div>
  );
}