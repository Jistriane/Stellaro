import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
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
  it('renders proposals and updates vote state on user action', async () => {
    render(<GovernanceVotePage />);

    await waitFor(() => {
      expect(screen.getByText('Governance voting')).toBeInTheDocument();
    });

    expect(screen.getByText('Increase APY to 9% for 90 days')).toBeInTheDocument();
    expect(screen.getAllByText('Enable flash loan feature').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Vote for' })[0]);
    expect(screen.getAllByText('You voted for').length).toBeGreaterThan(0);
    expect(screen.getByText('Voting history')).toBeInTheDocument();
  });
});