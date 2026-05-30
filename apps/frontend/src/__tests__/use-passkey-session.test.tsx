import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePasskeySession, type SessionKeyConfig } from '@/hooks/usePasskeySession';

describe('usePasskeySession', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-11-14T22:13:20.000Z'));
    vi.stubGlobal('fetch', fetchSpy);
    fetchSpy.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('creates a session and persists it locally', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ publicKey: 'G' + 'A'.repeat(55) }),
    } as Response);

    const config: SessionKeyConfig = {
      duration: 300,
      maxAmount: '1000',
      allowedOperations: ['payment', 'swap'],
      biometricRefresh: true,
    };

    const { result } = renderHook(() => usePasskeySession());

    await act(async () => {
      await result.current.createSession(config);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.sessionKey).toMatchObject({
      publicKey: 'G' + 'A'.repeat(55),
      permissions: config,
      active: true,
    });

    const stored = localStorage.getItem('stellaro_session_key');
    expect(stored).toContain('G' + 'A'.repeat(55));
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/passkey/session/create',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
  });

  it('restores an unexpired session and enforces permissions', async () => {
    const session = {
      publicKey: 'G' + 'B'.repeat(55),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      permissions: {
        duration: 300,
        maxAmount: '500',
        allowedOperations: ['payment', 'swap'],
        biometricRefresh: false,
      },
      active: true,
    };
    localStorage.setItem('stellaro_session_key', JSON.stringify(session));

    const { result } = renderHook(() => usePasskeySession());

    await act(async () => {
      const restored = result.current.restoreSession();
      expect(restored).not.toBeNull();
    });

    expect(result.current.canExecuteOperation('payment', '499')).toBe(true);
    expect(result.current.canExecuteOperation('borrow', '1')).toBe(false);
    expect(result.current.canExecuteOperation('payment', '501')).toBe(false);
  });

  it('revokeSession clears storage and notifies backend', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ publicKey: 'G' + 'C'.repeat(55) }) } as Response);

    const { result } = renderHook(() => usePasskeySession());

    await act(async () => {
      await result.current.createSession({
        duration: 60,
        maxAmount: '100',
        allowedOperations: ['payment'],
        biometricRefresh: false,
      });
    });

    fetchSpy.mockResolvedValueOnce({ ok: true } as Response);

    await act(async () => {
      await result.current.revokeSession();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/passkey/session/revoke',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(result.current.sessionKey).toBeNull();
    expect(localStorage.getItem('stellaro_session_key')).toBeNull();
  });
});
