import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { clearSession, login, saveSession } from '../../services/bankingApi';

export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const result = await login(email, password);

      if (result.user.role !== 'staff' && result.user.role !== 'manager') {
        clearSession();
        toast.error('Unauthorized role for staff portal');
        return;
      }

      saveSession(result.token, result.user);
      toast.success('Login successful!');
      navigate('/staff/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserCog className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Staff Login</h1>
        <p className="text-gray-600 text-center mb-8">Access the staff dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@securebank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-base font-semibold mt-6">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Demo credentials: staff@securebank.com / Password@123
        </p>
      </Card>
    </div>
  );
}
