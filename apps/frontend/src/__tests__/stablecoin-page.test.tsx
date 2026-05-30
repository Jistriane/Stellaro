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
    symbol: 'STLT',
    asset: 'BRL',
    paused: false,
    supply: '12345.67',
  })),
  getWalletBalances: vi.fn(async () => ({
    stlt: '42.5',
    xlm: '8.125',
  })),
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
    expect(screen.getByText('balances.brl.value {"value":"R$ 42.5"}')).toBeInTheDocument();
    expect(screen.getByText('balances.usd.value {"value":"$ 8.5"}')).toBeInTheDocument();
    expect(screen.getByText('status.supply_mock:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'actions.mint' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'edu.docs' })).toHaveAttribute('href', '/docs');
    expect(screen.getAllByRole('link', { name: 'movements.view_wallet' })).toHaveLength(3);
  });
});
