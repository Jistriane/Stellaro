import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useState } from 'react';

export function useBiometrics() {
  const [isCompatible, setIsCompatible] = useState<boolean | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);

  const checkSupport = useCallback(async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.hasHardwareAsync() && await LocalAuthentication.isEnrolledAsync();
    setIsCompatible(compatible);
    setIsEnrolled(enrolled);
    return { compatible, enrolled };
  }, []);

  const authenticate = useCallback(async (promptMessage: string = 'Autentique-se para continuar') => {
    const { compatible, enrolled } = await checkSupport();

    if (!compatible || !enrolled) {
      return { success: false, error: 'Biometria não disponível ou não configurada.' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Usar senha',
      disableDeviceFallback: false,
    });

    return { success: result.success, error: result.error };
  }, [checkSupport]);

  return {
    isCompatible,
    isEnrolled,
    checkSupport,
    authenticate,
  };
}
