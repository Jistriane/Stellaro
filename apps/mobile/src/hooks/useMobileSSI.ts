import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

export function useMobileSSI() {
  const [hasKyc, setHasKyc] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkKycStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulação: Verifica no armazenamento seguro do dispositivo
      const kycFlag = await SecureStore.getItemAsync('stellaro_kyc_verified');
      setHasKyc(kycFlag === 'true');
    } catch (error) {
      console.error('Mobile SSI Error:', error);
      setHasKyc(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestKyc = async () => {
    setIsLoading(true);
    try {
      // Simulação de fluxo de emissão de VC (Verifiable Credential) nativa
      // Em produção, isso poderia abrir um WebView ou um fluxo de OCR/Liveness
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      await SecureStore.setItemAsync('stellaro_kyc_verified', 'true');
      setHasKyc(true);
      return true;
    } catch (error) {
      console.error('Mobile KYC Request Error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkKycStatus();
  }, [checkKycStatus]);

  return {
    hasKyc,
    isLoading,
    requestKyc,
    refreshKycStatus: checkKycStatus
  };
}
