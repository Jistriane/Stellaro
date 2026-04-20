'use client';

import { useState, useCallback } from 'react';

/**
 * Hook to manage Session Keys with Passkeys
 * Allows transactions without re-authentication for limited period
 */

export interface SessionKeyConfig {
  duration: number; // seconds
  maxAmount: string; // stroops
  allowedOperations: ('payment' | 'swap' | 'supply' | 'borrow')[];
  biometricRefresh: boolean;
}

export interface SessionKey {
  publicKey: string;
  expiresAt: Date;
  permissions: SessionKeyConfig;
  active: boolean;
}

export function usePasskeySession() {
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a Session Key with limited permissions
   */
  const createSession = useCallback(async (config: SessionKeyConfig) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Integrate with @kalepail/passkey-kit when available
      // const passkeyKit = new PasskeyKit({ network: 'testnet' });
      // const session = await passkeyKit.createSession(config);

      // For now, use the backend endpoint
      const response = await fetch('/api/passkey/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to create session key');
      }

      const data = await response.json();
      
      const session: SessionKey = {
        publicKey: data.publicKey,
        expiresAt: new Date(Date.now() + config.duration * 1000),
        permissions: config,
        active: true
      };

      setSessionKey(session);
      
      // Store in localStorage for persistence
      localStorage.setItem('stellaro_session_key', JSON.stringify(session));

      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[usePasskeySession] Error creating session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Revoga Session Key ativa
   */
  const revokeSession = useCallback(async () => {
    if (!sessionKey) return;

    try {
      await fetch('/api/passkey/session/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: sessionKey.publicKey }),
        credentials: 'include'
      });

      setSessionKey(null);
      localStorage.removeItem('stellaro_session_key');
    } catch (err) {
      console.error('[usePasskeySession] Error revoking session:', err);
      throw err;
    }
  }, [sessionKey]);

  /**
   * Check if operation is allowed by session key
   */
  const canExecuteOperation = useCallback((
    operation: SessionKeyConfig['allowedOperations'][number],
    amount: string
  ): boolean => {
    if (!sessionKey || !sessionKey.active) return false;
    if (new Date() > sessionKey.expiresAt) return false;
    if (!sessionKey.permissions.allowedOperations.includes(operation)) return false;
    
    const amountNum = parseInt(amount, 10);
    const maxAmountNum = parseInt(sessionKey.permissions.maxAmount, 10);
    
    return amountNum <= maxAmountNum;
  }, [sessionKey]);

  /**
   * Execute transaction using Session Key
   */
  const executeWithSession = useCallback(async (
    operation: SessionKeyConfig['allowedOperations'][number],
    params: Record<string, any>
  ) => {
    if (!canExecuteOperation(operation, params.amount || '0')) {
      throw new Error('Operation not allowed by session key permissions');
    }

    const response = await fetch('/api/passkey/session/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionKey: sessionKey?.publicKey,
        operation,
        params
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Transaction execution failed');
    }

    return await response.json();
  }, [sessionKey, canExecuteOperation]);

  /**
   * Restaura session key do localStorage
   */
  const restoreSession = useCallback(() => {
    try {
      const stored = localStorage.getItem('stellaro_session_key');
      if (!stored) return null;

      const session: SessionKey = JSON.parse(stored);
      
      // Verifica se expirou
      if (new Date() > new Date(session.expiresAt)) {
        localStorage.removeItem('stellaro_session_key');
        return null;
      }

      setSessionKey(session);
      return session;
    } catch (err) {
      console.error('[usePasskeySession] Error restoring session:', err);
      return null;
    }
  }, []);

  return {
    sessionKey,
    loading,
    error,
    createSession,
    revokeSession,
    canExecuteOperation,
    executeWithSession,
    restoreSession
  };
}
