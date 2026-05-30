import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getWalletBalances, setBalances } = vi.hoisted(() => ({
  getWalletBalances: vi.fn(),
  setBalances: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/WalletDebug', () => ({
  default: () => <div data-testid="wallet-debug" />,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

vi.mock('@/lib/soroban', () => ({
  getWalletBalances,
}));

vi.mock('@/store/app', () => ({
  useAppStore: (selector: (state: {
    auth: { publicKey?: string; loggedIn: boolean };
    balances: { xlm?: string; stlt?: string };
    setBalances: typeof setBalances;
  }) => unknown) =>
    selector({
      auth: { loggedIn: false },
      balances: {},
      setBalances,
    }),
}));

import WalletPage from '@/app/wallet/page';

describe('WalletPage', () => {
  beforeEach(() => {
    getWalletBalances.mockReset();
    setBalances.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the login prompt when no wallet is connected', () => {
    render(<WalletPage />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('login_to_view')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-debug')).toBeInTheDocument();
    expect(getWalletBalances).not.toHaveBeenCalled();
    expect(screen.queryByText('wallet.public_key')).not.toBeInTheDocument();
  });
});
