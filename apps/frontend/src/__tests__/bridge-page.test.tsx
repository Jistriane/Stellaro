import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import BridgePage from '@/app/bridge/page';

describe('BridgePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('converts amounts, swaps chains and resets the form after bridging', async () => {
    render(<BridgePage />);

    const [sourceChainSelect, destinationChainSelect] = screen.getAllByRole('combobox');

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(sourceChainSelect).toHaveValue('stellar');
    expect(destinationChainSelect).toHaveValue('ethereum');
    expect(screen.getByText('Wormhole')).toBeInTheDocument();
    expect(screen.getByText('Stellar → Ethereum')).toBeInTheDocument();
    expect(screen.getByText('safety_information')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter amount'), { target: { value: '10' } });

    expect(screen.getByPlaceholderText('Enter amount')).toHaveValue(10);
    expect(screen.getByLabelText('You will receive')).toHaveValue(9.5);

    fireEvent.click(screen.getByRole('button', { name: 'Swap chains' }));

    expect(sourceChainSelect).toHaveValue('ethereum');
    expect(destinationChainSelect).toHaveValue('stellar');

    fireEvent.click(screen.getByRole('button', { name: 'bridge_button' }));
    expect(screen.getByRole('button', { name: 'bridging' })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'bridge_button' })).toBeDisabled();
    expect(screen.getByPlaceholderText('Enter amount')).toHaveValue(null);
    expect(screen.getByLabelText('You will receive')).toHaveValue(null);
  });
});