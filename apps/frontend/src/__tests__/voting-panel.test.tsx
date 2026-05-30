import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VotingPanel } from '@/components/VotingPanel';

describe('VotingPanel', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch');

  beforeEach(() => {
    fetchSpy.mockReset();
  });

  afterEach(() => {
    fetchSpy.mockReset();
  });

  it('submits a positive vote and shows the success state', async () => {
    fetchSpy.mockResolvedValue({ ok: true } as Response);

    render(<VotingPanel proposalId="P-123" title="Improve Governance" />);

    fireEvent.click(screen.getByRole('button', { name: /favorável/i }));

    expect(screen.getAllByRole('button', { name: /processando/i })).toHaveLength(2);

    await waitFor(() => {
      expect(screen.getByText('Voto registrado com sucesso on-chain!')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/dao/P-123/vote',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('recovers from vote submission errors without crashing', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<VotingPanel proposalId="P-321" title="Expand Coverage" />);

    fireEvent.click(screen.getByRole('button', { name: /contrário/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /contrário/i })).toBeEnabled();
    });

    expect(screen.getByText('Votar na Proposta: Expand Coverage')).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
