import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    title: 'Governance voting',
    subtitle: 'Vote on active protocol decisions',
    voting_power: 'Voting power',
    voting_tokens: 'Voting tokens',
    voting_power_label: 'Voting share',
    proposals_voted: 'Proposals voted',
    voting_status: 'Voting status',
    active: 'Active',
    for: 'For',
    against: 'Against',
    quorum: 'Quorum',
    days_remaining: 'days remaining',
    you_voted_for: 'You voted for',
    vote_for: 'Vote for',
    vote_against: 'Vote against',
    voting_history: 'Voting history',
  }[key] ?? key),
}));

import GovernanceVotePage from '@/app/governance/vote/page';

describe('GovernanceVotePage', () => {
  it('renders vote page with voting disabled to avoid simulated votes', async () => {
    render(<GovernanceVotePage />);

    await waitFor(() => {
      expect(screen.getAllByText('Governance voting').length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(/Voting está desabilitado neste build para evitar votos simulados/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver propostas' })).toHaveAttribute('href', '/governance');
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
  });
});
