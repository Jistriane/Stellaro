import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import DocsPage from '@/app/docs/page';

describe('DocsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the getting started section and filters articles by search', () => {
    render(<DocsPage />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(screen.getByText('What is Stellaro?')).toBeInTheDocument();
    expect(screen.getByText('Set Up Your Account')).toBeInTheDocument();
    expect(screen.getByText('Understanding the Dashboard')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('search'), { target: { value: 'wallet' } });
    fireEvent.click(screen.getByRole('button', { name: 'sections.wallets' }));

    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.queryByText('Manage Assets')).not.toBeInTheDocument();
    expect(screen.queryByText('Transaction History')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('search'), { target: { value: 'zzzz' } });

    expect(screen.getByText('no_results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View API Docs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open FAQ' })).toBeInTheDocument();
  });
});