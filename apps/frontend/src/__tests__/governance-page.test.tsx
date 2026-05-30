import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getContractIds, viewGovernance, createProposal, queueProposal, executeProposal } = vi.hoisted(() => ({
  getContractIds: vi.fn(),
  viewGovernance: vi.fn(),
  createProposal: vi.fn(),
  queueProposal: vi.fn(),
  executeProposal: vi.fn(),
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
  viewGovernance,
  createProposal,
  queueProposal,
  executeProposal,
}));

import GovernancePage from '@/app/governance/page';

describe('GovernancePage', () => {
  beforeEach(() => {
    getContractIds.mockReturnValue({
      GOVERNANCE_CONTRACT_ID: 'gov-contract-321',
      LOANSPOOL_CONTRACT_ID: 'loans-pool-456',
    });
    viewGovernance.mockResolvedValue({
      admin: 'G' + 'F'.repeat(55),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders governance summary after loading data', async () => {
    render(<GovernancePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('header.title')).toBeInTheDocument();
    });

    expect(screen.getByText('SSI Compliant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Proposal' })).toBeEnabled();
    expect(screen.getByText('gov-contract-321')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Change STLT-BRL mint fee to 0.05%')).toBeInTheDocument();
    expect(screen.getByText('Adjust Pix limit to R$ 50k')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'open.details' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'summary.docs' })).toHaveAttribute('href', '/docs');
    expect(viewGovernance).toHaveBeenCalled();
  });
});