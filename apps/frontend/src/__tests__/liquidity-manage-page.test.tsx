import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

import LiquidityManagePage from '@/app/liquidity/manage/page';

describe('LiquidityManagePage', () => {
  it('renders liquidity management shell and action buttons', () => {
    render(<LiquidityManagePage />);

    expect(screen.getByAltText('Stellaro background')).toBeInTheDocument();
    expect(screen.getByText('Liquidity Management')).toBeInTheDocument();
    expect(screen.getByText('STLT-BRL / XLM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Position' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
  });
});