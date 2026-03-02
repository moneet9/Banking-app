// Mock encryption utilities
// In a real app, this would use SubtleCrypto or a library like 'tweetnacl'

export const MOCK_ENCRYPTION_KEY = 'demo-secret-key';

export const encryptMessage = async (text: string, _key: string = MOCK_ENCRYPTION_KEY): Promise<string> => {
  // Simulate async encryption
  await new Promise((resolve) => setTimeout(resolve, 50));
  // Simple "encryption" for demo: base64 encode with a prefix
  return `enc_${btoa(text)}`;
};

export const decryptMessage = async (encryptedText: string, _key: string = MOCK_ENCRYPTION_KEY): Promise<string> => {
  // Simulate async decryption
  await new Promise((resolve) => setTimeout(resolve, 50));
  
  if (!encryptedText.startsWith('enc_')) {
    return encryptedText; // Fallback for unencrypted/system messages
  }
  
  try {
    const base64 = encryptedText.substring(4);
    return atob(base64);
  } catch (e) {
    console.error("Decryption failed", e);
    return "**Decryption Error**";
  }
};

export const isEncrypted = (text: string): boolean => {
  return text.startsWith('enc_');
};
