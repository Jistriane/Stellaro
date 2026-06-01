import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    'pools.title': 'Liquidity pools',
    'pools.subtitle': 'Manage and track pool positions',
  }[key] ?? key),
}));

import LiquidityPoolsPage from '@/app/liquidity/pools/page';

describe('LiquidityPoolsPage', () => {
  it('renders pools screen without simulated pool data', async () => {
    render(<LiquidityPoolsPage />);

    await waitFor(() => {
      expect(screen.getByText('Liquidity pools')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Add Liquidity' })).toBeDisabled();
    expect(screen.getByText(/Para evitar dados simulados/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gerenciar liquidez' })).toHaveAttribute('href', '/liquidity/manage');
  });
});
