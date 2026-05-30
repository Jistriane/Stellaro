import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import NotificationsPage from '@/app/notifications/page';

describe('NotificationsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads mock notifications and marks unread items as read', async () => {
    render(<NotificationsPage />);

    expect(await screen.findByText('Loan Liquidation Warning')).toBeInTheDocument();
    expect(screen.getByText('APY Increased')).toBeInTheDocument();
    expect(screen.getByText('Transaction Completed')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'unread_filter (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'mark_all_read' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'unread_filter (3)' }));

    expect(screen.getByText('Loan Liquidation Warning')).toBeInTheDocument();
    expect(screen.getByText('APY Increased')).toBeInTheDocument();
    expect(screen.getByText('Payment Due Soon')).toBeInTheDocument();
    expect(screen.queryByText('Transaction Completed')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'mark_all_read' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'mark_all_read' })).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'unread_filter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'mark_as_read' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'success_filter' }));

    expect(screen.getByText('Transaction Completed')).toBeInTheDocument();
    expect(screen.queryByText('Loan Liquidation Warning')).not.toBeInTheDocument();
  });
});