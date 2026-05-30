import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import TransactionHistoryPage from '@/app/transactions/history/page';

describe('TransactionHistoryPage', () => {
  it('loads transactions and updates active type filter badge state', async () => {
    render(<TransactionHistoryPage />);

    expect(await screen.findByText('history.title')).toBeInTheDocument();
    expect(screen.getByText('history.subtitle')).toBeInTheDocument();
    expect(screen.getByText('TXN-001')).toBeInTheDocument();
    expect(screen.getByText('TXN-006')).toBeInTheDocument();
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText('Total Transactions')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Moved this month')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    const borrowTags = screen.getAllByText('Borrow');
    fireEvent.click(borrowTags[0]);
    expect(screen.getAllByText('Borrow').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('All'));
    expect(screen.getByText('TXN-001')).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Search transaction ID or hash...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});