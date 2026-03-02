// ============================================================================
// Profile Drawer
// ============================================================================

import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { User, Wallet, Shield, Copy, ExternalLink, LogOut } from 'lucide-react';
import { formatAddress, formatFullAddress, getInitials } from '../../utils/format';
import { toast } from 'sonner';

export function ProfileDrawer() {
  const { drawerOpen, drawerContent, closeDrawer } = useUIStore();
  const { user } = useAuthStore();
  const { signOut, chainId, isCorrectNetwork } = useWeb3Auth();

  const isOpen = drawerOpen && drawerContent === 'profile';

  const handleCopyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleViewOnExplorer = () => {
    if (!user?.address || !chainId) return;

    const explorers: Record<number, string> = {
      11155111: 'https://sepolia.etherscan.io',
      80001: 'https://mumbai.polygonscan.com',
      5: 'https://goerli.etherscan.io',
    };

    const explorerUrl = explorers[chainId];
    if (explorerUrl) {
      window.open(`${explorerUrl}/address/${user.address}`, '_blank');
    }
  };

  const getNetworkName = () => {
    const networks: Record<number, string> = {
      11155111: 'Sepolia',
      80001: 'Polygon Mumbai',
      5: 'Goerli',
    };
    return chainId ? networks[chainId] || 'Unknown' : 'Not connected';
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </SheetTitle>
          <SheetDescription>Your account information</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-2xl">
                {getInitials(user?.username || user?.address || '')}
              </AvatarFallback>
            </Avatar>

            <h3 className="text-xl font-semibold mb-1">
              {user?.username || 'Anonymous User'}
            </h3>

            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-1.5" />
              Online
            </Badge>
          </div>

          <Separator />

          {/* Wallet Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Wallet className="w-4 h-4" />
              Wallet Address
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-gray-600 break-all">
                  {user?.address}
                </code>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyAddress}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={handleViewOnExplorer}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Explorer
                </Button>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="w-4 h-4" />
              Network
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Network</span>
                <Badge
                  variant={isCorrectNetwork() ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getNetworkName()}
                </Badge>
              </div>

              {!isCorrectNetwork() && (
                <p className="text-xs text-red-600 mt-2">
                  Please switch to a supported testnet
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                closeDrawer();
                signOut();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              🔒 Your messages are end-to-end encrypted. Only you and the
              recipients can read them.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
