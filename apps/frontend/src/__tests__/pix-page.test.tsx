import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getX402Status, getEtherfuseStatus, getWalletBalances, refreshBalance } = vi.hoisted(() => ({
  getX402Status: vi.fn(),
  getEtherfuseStatus: vi.fn(),
  getWalletBalances: vi.fn(),
  refreshBalance: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

vi.mock('@/lib/x402', () => ({
  getX402Status,
  createX402Quote: vi.fn(),
}));

vi.mock('@/lib/etherfuse', () => ({
  getEtherfuseStatus,
  createEtherfuseQuote: vi.fn(),
  createEtherfuseOrder: vi.fn(),
}));

vi.mock('@/lib/soroban', () => ({
  getWalletBalances,
  getHorizonBaseUrl: vi.fn(() => 'https://horizon.test'),
}));

vi.mock('@/state/wallet', () => ({
  useWalletStore: (selector: (state: {
    connected: boolean;
    address: string;
    network: string;
    refreshBalance: typeof refreshBalance;
  }) => unknown) => selector({
    connected: false,
    address: '',
    network: 'testnet',
    refreshBalance,
  }),
}));

import PixPage from '@/app/pix/page';

describe('PixPage', () => {
  beforeEach(() => {
    getX402Status.mockResolvedValue({
      enabled: false,
      mode: 'disabled',
      network: 'stellar:testnet',
      acceptedAsset: 'STLT',
      resource: '/payments/x402/settle',
      facilitatorUrl: null,
      providerContractId: null,
      recipient: null,
      apiKeyConfigured: false,
    });
    getEtherfuseStatus.mockResolvedValue({
      enabled: false,
      mode: 'disabled',
      apiBaseUrl: 'https://api.sand.etherfuse.com',
      blockchain: 'stellar',
      defaultQuoteType: 'onramp',
      defaultSourceAsset: 'MXN',
      defaultTargetAsset: 'USDC:test',
      customerIdConfigured: false,
      walletAddressConfigured: false,
      apiKeyConfigured: false,
    });
    getWalletBalances.mockReset();
    refreshBalance.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows unavailable service state when no wallet is connected', async () => {
    render(<PixPage />);

    expect(screen.getByText('header.title')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to enable Pix.')).toBeInTheDocument();
    expect(screen.getByText('service.unavailable')).toBeInTheDocument();
    expect(screen.getByText('R$ 0 available')).toBeInTheDocument();
    expect(screen.getByText('XLM: 0 • STLT: 0')).toBeInTheDocument();
    expect(screen.getByText('Daily limit: R$ 0')).toBeInTheDocument();
    expect(screen.getByText('Connect wallet to generate key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'deposit.copy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Generate payload' })).toBeDisabled();

    await waitFor(() => {
      expect(getX402Status).toHaveBeenCalled();
      expect(getEtherfuseStatus).toHaveBeenCalled();
    });

    expect(getWalletBalances).not.toHaveBeenCalled();
    expect(refreshBalance).not.toHaveBeenCalled();
  });
});