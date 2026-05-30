import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setLoggedIn = vi.fn();
const setBalances = vi.fn();
const pushEvent = vi.fn();
const refreshAvailable = vi.fn();

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/store/app', () => ({
  useAppStore: (selector: (state: {
    setLoggedIn: typeof setLoggedIn;
    setBalances: typeof setBalances;
    pushEvent: typeof pushEvent;
  }) => unknown) =>
    selector({
      setLoggedIn,
      setBalances,
      pushEvent,
    }),
}));

vi.mock('@/state/wallet', () => ({
  useWalletStore: (selector: (state: {
    available: Array<{ id: string; available: boolean }>;
    refreshAvailable: typeof refreshAvailable;
  }) => unknown) =>
    selector({
      available: [],
      refreshAvailable,
    }),
}));

vi.mock('@/lib/soroban', () => ({
  getWalletBalances: vi.fn(),
}));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    setLoggedIn.mockReset();
    setBalances.mockReset();
    pushEvent.mockReset();
    refreshAvailable.mockReset();
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.local');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows a validation error when email is missing', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'email_button' }));

    await waitFor(() => {
      expect(screen.getByText('email_required')).toBeInTheDocument();
    });

    expect(refreshAvailable).toHaveBeenCalled();
    expect(setLoggedIn).not.toHaveBeenCalled();
  });

  it('focuses the email input when validation fails', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('email_placeholder');
    fireEvent.click(screen.getByRole('button', { name: 'email_button' }));

    await waitFor(() => {
      expect(screen.getByText('email_required')).toBeInTheDocument();
    });

    expect(emailInput).toHaveFocus();
  });
});
