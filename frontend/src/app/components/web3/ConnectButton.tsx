import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Loader2, LogOut, Wallet } from 'lucide-react';
import { shortenAddress } from '../../utils/format';
import { useState } from 'react';

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { login, logout, isAuthenticated, user } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);

  const handleLogin = async () => {
    if (!address) return;
    setIsSigning(true);
    try {
      const message = `Sign in to Web3 Chat\nNonce: ${Math.random().toString(36).substring(7)}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      await login(address, signature);
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    logout();
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end mr-2">
          <span className="text-sm font-medium">{user.username}</span>
          <span className="text-xs text-muted-foreground">{shortenAddress(user.address)}</span>
        </div>
        <Button variant="outline" size="icon" onClick={handleDisconnect} title="Disconnect">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <Button 
        onClick={handleLogin} 
        disabled={isSigning}
        className="gap-2"
      >
        {isSigning ? <Loader2 className="animate-spin h-4 w-4" /> : <Wallet className="h-4 w-4" />}
        {isSigning ? 'Signing...' : 'Sign In with Wallet'}
      </Button>
    );
  }

  return (
    <Button 
      onClick={() => connect({ connector: connectors[0] })}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
