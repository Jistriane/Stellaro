import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletStore } from '@/state/wallet';

const { getContractIds, hasValidVc } = vi.hoisted(() => ({
  getContractIds: vi.fn(),
  hasValidVc: vi.fn(),
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

vi.mock('@/lib/soroban', () => ({
  getContractIds,
  hasValidVc,
}));

import GovernancePage from '@/app/governance/page';

describe('GovernancePage', () => {
  beforeEach(() => {
    useWalletStore.setState({ address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' });
    getContractIds.mockReturnValue({
      GOVERNANCE_CONTRACT_ID: 'gov-contract-321',
      LOANSPOOL_CONTRACT_ID: 'loans-pool-456',
    });
    hasValidVc.mockResolvedValue(true);
  });

  afterEach(() => {
    useWalletStore.setState({ address: null });
    vi.clearAllMocks();
  });

  it('renders governance summary after loading data', async () => {
    render(<GovernancePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('header.title')).toBeInTheDocument();
    });

    expect(screen.getByText('SSI Compliant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Proposal' })).toBeDisabled();
    expect(screen.getByText('gov-contract-321')).toBeInTheDocument();
    expect(screen.getByText(/Falha ao carregar propostas/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'summary.docs' })).toHaveAttribute('href', '/docs');
    expect(hasValidVc).toHaveBeenCalled();
  });
});
