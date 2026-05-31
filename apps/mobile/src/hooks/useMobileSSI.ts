import { useState, useEffect, useCallback } from 'react';
import { ensureWalletSession, getMyKyc, submitBasicKyc } from '../lib/backend';

export function useMobileSSI() {
  const [hasKyc, setHasKyc] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkKycStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await ensureWalletSession();
      if (!session.ok) {
        setHasKyc(false);
        return;
      }
      const kyc = await getMyKyc();
      setHasKyc(kyc?.status === 'Approved');
    } catch (error) {
      console.error('Mobile SSI Error:', error);
      setHasKyc(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestKyc = async (params: { document: string; name: string }) => {
    setIsLoading(true);
    try {
      const session = await ensureWalletSession();
      if (!session.ok) return { ok: false };
      const res = await submitBasicKyc(params);
      await checkKycStatus();
      return res;
    } catch (error) {
      console.error('Mobile KYC Request Error:', error);
      return { ok: false };
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
