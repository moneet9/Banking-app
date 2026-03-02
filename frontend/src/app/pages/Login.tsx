import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAccount } from 'wagmi';
import { useAuthStore } from '../store/authStore';
import { ConnectButton } from '../components/web3/ConnectButton';
import { MessageSquare, Shield, Zap } from 'lucide-react';

export function Login() {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected && isAuthenticated) {
      navigate('/');
    }
  }, [isConnected, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-lg mx-auto p-6 space-y-8 text-center">
        <div className="space-y-2">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25 rotate-3 hover:rotate-6 transition-transform">
              <MessageSquare className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Web3 Chat
          </h1>
          <p className="text-xl text-muted-foreground">
            End-to-end encrypted messaging for the decentralized web.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 py-8">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border shadow-sm">
            <Shield className="h-6 w-6 text-green-500 shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your messages are encrypted client-side.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-card border shadow-sm">
            <Zap className="h-6 w-6 text-yellow-500 shrink-0" />
            <div className="text-left">
              <h3 className="font-semibold">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">Real-time communication powered by WebSockets.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <ConnectButton />
          <p className="text-xs text-muted-foreground max-w-xs">
            By connecting, you agree to sign a message verifying your ownership of the wallet address.
          </p>
        </div>
      </div>
    </div>
  );
}
