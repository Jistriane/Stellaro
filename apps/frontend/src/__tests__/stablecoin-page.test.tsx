import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

vi.mock('@/lib/soroban', () => ({
  getContractIds: vi.fn(() => ({
    STELLAR_PUBLIC_KEY: 'G' + 'E'.repeat(55),
    STABLECOIN_CONTRACT_ID: 'stablecoin-789',
  })),
  viewStablecoin: vi.fn(async () => ({
    contractId: null,
    symbol: 'STLT',
    asset: 'BRL',
    decimals: 7,
    supply: 12345.67,
    timestamp: '2026-01-01T00:00:00.000Z',
  })),
  getWalletBalances: vi.fn(async () => ({
    stlt: '42.5',
    xlm: '8.125',
  })),
  getHorizonBaseUrl: vi.fn(() => 'https://horizon.stellar.org'),
}));

import StablecoinPage from '@/app/stablecoin/page';

describe('StablecoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders stablecoin contract data after loading', async () => {
    render(<StablecoinPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('contract.id')).toBeInTheDocument();
    });

    expect(screen.getAllByText('stablecoin-789')).toHaveLength(2);
    expect(screen.getByText('contract.symbol:')).toBeInTheDocument();
    expect(screen.getByText('STLT')).toBeInTheDocument();
    expect(screen.getByText(/42\.5\s+STLT/i)).toBeInTheDocument();
    expect(screen.getByText(/12,345\.67/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'actions.mint' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'edu.docs' })).toHaveAttribute('href', '/docs');
    expect(screen.getByText('wallet.login_to_view')).toBeInTheDocument();
  });
});
