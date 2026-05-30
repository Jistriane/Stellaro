import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import CardsPage from '@/app/cards/page';

describe('CardsPage', () => {
  const alertMock = vi.fn();
  const writeTextMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.stubGlobal('alert', alertMock);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    alertMock.mockReset();
    writeTextMock.mockReset();
  });

  it('reveals card data, copies the number and toggles blocked status', async () => {
    render(<CardsPage />);

    expect(screen.getByText('header.title')).toBeInTheDocument();
    expect(screen.getByText('summary.title')).toBeInTheDocument();
    expect(screen.getByText('1234 **** **** 9876')).toBeInTheDocument();
    expect(screen.getByText('2233 **** **** 4455')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 2,200/)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 800/)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'card.show_data' })[0]);

    expect(screen.getByText('1234 5678 9012 9876')).toBeInTheDocument();
    expect(screen.getByText('12/28')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'card.copy' }));
    });
    expect(writeTextMock).toHaveBeenCalledWith('1234 5678 9012 9876');

    fireEvent.click(screen.getAllByRole('button', { name: 'card.block' })[0]);
    expect(screen.getByText('card.status_blocked')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'card.unblock' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'summary.request_virtual' }));
    expect(alertMock).toHaveBeenCalledWith('actions.request_sent {"kind":"card.type_virtual"}');

    expect(screen.getByRole('link', { name: 'settings.docs_link' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'help.dispute' })).toHaveAttribute('href', '/help');
  });
});