import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VotingPanel } from '@/components/VotingPanel';

describe('VotingPanel', () => {
  it('renders voting disabled to avoid simulated transactions', () => {
    render(<VotingPanel proposalId="P-123" title="Improve Governance" />);

    expect(screen.getByText('Votar na Proposta: Improve Governance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /favorável/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /contrário/i })).toBeDisabled();
    expect(
      screen.getByText(/Voting está desabilitado neste build para evitar transações simuladas/i),
    ).toBeInTheDocument();
    expect(screen.getByText('ProposalId: P-123')).toBeInTheDocument();
  });
});
