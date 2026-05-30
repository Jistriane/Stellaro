import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import LearnPage from '@/app/learn/page';

describe('LearnPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders courses and filters tutorials by category', () => {
    render(<LearnPage />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('courses.title')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Stellaro')).toBeInTheDocument();
    expect(screen.getByText('Advanced DeFi Trading')).toBeInTheDocument();
    expect(screen.getByText('Governance and DAOs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByText('How to Connect Your Wallet')).toBeInTheDocument();
    expect(screen.getByText('Set Up 2FA Security')).toBeInTheDocument();
    expect(screen.getByText('Advanced Collateral Strategy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Security' }));

    expect(screen.getByText('Set Up 2FA Security')).toBeInTheDocument();
    expect(screen.queryByText('How to Connect Your Wallet')).not.toBeInTheDocument();
    expect(screen.queryByText('Advanced Collateral Strategy')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Loans' }));

    expect(screen.getByText('Advanced Collateral Strategy')).toBeInTheDocument();
    expect(screen.queryByText('Set Up 2FA Security')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Webinars' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read Articles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join the Community' })).toBeInTheDocument();
  });
});