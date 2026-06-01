import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchSpy = vi.fn();

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode }) => <a href={props.href}>{props.children}</a>,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

import ProfilePage from '@/app/profile/page';

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy);
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue({ status: 401, ok: false } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the sign-in banner when the user is not authenticated', async () => {
    render(<ProfilePage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('You are not signed in. Sign in to load your profile, KYC status, and submission history.')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Sign in now' })).toHaveAttribute('href', '/login');
    expect(screen.getByText('No documents submitted yet.')).toBeInTheDocument();
    expect(screen.getByText('No KYC submissions found.')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/auth/me', expect.objectContaining({ credentials: 'include' }));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
