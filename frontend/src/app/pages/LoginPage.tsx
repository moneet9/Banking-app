// ============================================================================
// Login Page - Wallet Connection & SIWE
// ============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useConnect, useAccount } from 'wagmi';
import { useWeb3Auth } from '../hooks/useWeb3Auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Wallet, Shield, Lock, MessageSquare, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading, signIn, isCorrectNetwork } = useWeb3Auth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  // Auto sign-in when wallet connects
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading) {
      if (!isCorrectNetwork()) {
        return; // Don't auto-sign if wrong network
      }
      signIn();
    }
  }, [isConnected, isAuthenticated, isLoading, signIn, isCorrectNetwork]);

  const handleConnect = () => {
    const metaMaskConnector = connectors.find((c) => c.id === 'metaMask');
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  const showNetworkWarning = isConnected && !isCorrectNetwork();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Web3 Chat</h1>
          <p className="text-gray-600">
            Secure, encrypted messaging on the blockchain
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Sign in with MetaMask to access your encrypted chats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Network Warning */}
            {showNetworkWarning && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect to a supported testnet (Sepolia, Goerli, or Polygon Mumbai)
                </AlertDescription>
              </Alert>
            )}

            {/* Connect Button */}
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                className="w-full h-12"
                size="lg"
                disabled={isLoading}
              >
                <Wallet className="w-5 h-5 mr-2" />
                Connect MetaMask
              </Button>
            ) : (
              <Button
                onClick={signIn}
                className="w-full h-12"
                size="lg"
                disabled={isLoading || showNetworkWarning}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Sign Message
                  </>
                )}
              </Button>
            )}

            {/* Features */}
            <div className="pt-6 space-y-3 border-t">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">End-to-End Encrypted</p>
                  <p className="text-sm text-gray-600">
                    All messages are encrypted on your device
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Web3 Authentication</p>
                  <p className="text-sm text-gray-600">
                    Sign in securely with your Ethereum wallet
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Real-time Messaging</p>
                  <p className="text-sm text-gray-600">
                    Instant delivery with WebSocket technology
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By connecting, you agree to sign a message to verify your wallet ownership
        </p>
      </div>
    </div>
  );
}
