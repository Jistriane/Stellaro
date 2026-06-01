import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import TransactionHistoryPage from '@/app/transactions/history/page';

describe('TransactionHistoryPage', () => {
  it('renders without mocked transactions when wallet is disconnected', async () => {
    render(<TransactionHistoryPage />);

    expect(await screen.findByText('history.title')).toBeInTheDocument();
    expect(screen.getByText('history.subtitle')).toBeInTheDocument();
    expect(screen.getByText('Transaction History')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Search transaction ID or hash...')).toBeInTheDocument();
    expect(screen.getByText(/Conecte uma carteira/i)).toBeInTheDocument();
  });
});
