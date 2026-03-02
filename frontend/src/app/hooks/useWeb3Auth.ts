// ============================================================================
// Web3 Authentication Hook
// ============================================================================

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useAuthStore } from '../store/useAuthStore';
import { SIWE_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';
import { getNonce, loginWithSignature } from '../services/mockApi';
import { initializeSocket } from '../services/mockSocket';
import { toast } from 'sonner';

// ============================================================================
// Hook Interface
// ============================================================================

export function useWeb3Auth() {
  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect: disconnectWallet } = useDisconnect();
  
  const { login, logout, setIsConnecting, setError, isAuthenticated, user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // Sign-In with Ethereum (SIWE)
  // ============================================================================

  const signIn = useCallback(async () => {
    if (!address || !isConnected) {
      toast.error(ERROR_MESSAGES.WALLET_NOT_FOUND);
      return;
    }

    try {
      setIsLoading(true);
      setIsConnecting(true);
      setError(null);

      // Step 1: Get nonce from server
      const nonceResponse = await getNonce(address);
      if (!nonceResponse.success || !nonceResponse.data) {
        throw new Error('Failed to get nonce');
      }

      const nonce = nonceResponse.data.nonce;

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: SIWE_CONFIG.domain,
        address,
        statement: SIWE_CONFIG.statement,
        uri: SIWE_CONFIG.uri,
        version: SIWE_CONFIG.version,
        chainId: chainId || 1,
        nonce,
      });

      const messageText = message.prepareMessage();

      // Step 3: Sign message with wallet
      const signature = await signMessageAsync({ message: messageText });

      // Step 4: Verify signature and log in
      const loginResponse = await loginWithSignature(address, signature, messageText);

      if (!loginResponse.success || !loginResponse.data) {
        throw new Error(loginResponse.error || ERROR_MESSAGES.AUTH_FAILED);
      }

      const { user: userData, token } = loginResponse.data;

      // Step 5: Save auth state
      login(userData, token);

      // Step 6: Initialize socket connection
      initializeSocket(token);

      toast.success(SUCCESS_MESSAGES.WALLET_CONNECTED);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      const errorMessage = error.message?.includes('rejected')
        ? ERROR_MESSAGES.SIGNATURE_REJECTED
        : ERROR_MESSAGES.AUTH_FAILED;
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  }, [
    address,
    isConnected,
    chainId,
    signMessageAsync,
    login,
    setIsConnecting,
    setError,
  ]);

  // ============================================================================
  // Sign Out
  // ============================================================================

  const signOut = useCallback(() => {
    logout();
    disconnectWallet();
    toast.success('Signed out successfully');
  }, [logout, disconnectWallet]);

  // ============================================================================
  // Check Network
  // ============================================================================

  const isCorrectNetwork = useCallback(() => {
    if (!chainId) return false;
    // Check if on supported testnet
    const supportedChainIds = [11155111, 80001, 5]; // Sepolia, Mumbai, Goerli
    return supportedChainIds.includes(chainId);
  }, [chainId]);

  // ============================================================================
  // Return Hook Values
  // ============================================================================

  return {
    // State
    address,
    isConnected,
    chainId,
    isAuthenticated,
    user,
    isLoading,
    
    // Actions
    signIn,
    signOut,
    
    // Utilities
    isCorrectNetwork,
  };
}
