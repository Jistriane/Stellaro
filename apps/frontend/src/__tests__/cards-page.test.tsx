import { render, screen, waitFor } from '@testing-library/react';
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders cards page without simulated card data', async () => {
    render(<CardsPage />);

    expect(screen.getByText('header.title')).toBeInTheDocument();
    expect(screen.getByText('summary.title')).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByText(/Indisponível: não foi possível consultar o backend/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'settings.docs_link' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('link', { name: 'help.dispute' })).toHaveAttribute('href', '/help');
  });
});
