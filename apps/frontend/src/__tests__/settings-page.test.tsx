import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { push, replace, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en-US',
  useTranslations: () => {
    const translate = ((key: string, values?: Record<string, string | number>) =>
      values ? `${key} ${JSON.stringify(values)}` : key) as ((key: string, values?: Record<string, string | number>) => string) & {
      raw: (key: string) => string[];
    };
    translate.raw = (key: string) => {
      if (key === 'prefs.email_opts') {
        return ['All', 'Security Only', 'None'];
      }
      return [];
    };
    return translate;
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, refresh }),
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

import SettingsPage from '@/app/settings/page';

describe('SettingsPage', () => {
  const fetchMock = vi.fn();
  const alertMock = vi.fn();
  const confirmMock = vi.fn(() => true);
  const replaceLocationMock = vi.fn();
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation((message: unknown) => {
      const text = typeof message === 'string' ? message : '';
      if (text.includes('not wrapped in act')) {
        return;
      }
    });
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test';
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { id: 'user-123', name: 'Alice Doe', email: 'alice@example.com' } }),
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('alert', alertMock);
    vi.stubGlobal('confirm', confirmMock);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/settings',
        search: '?tab=profile',
        replace: replaceLocationMock,
      },
    });
  });

  afterEach(() => {
    consoleErrorMock.mockRestore();
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    fetchMock.mockReset();
    alertMock.mockReset();
    confirmMock.mockReset();
    replaceLocationMock.mockReset();
  });

  it('loads profile data and supports key local interactions', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alice Doe')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('account.kyc {"status":"Pending"}')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/auth/me', { credentials: 'include' });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'privacy.export' }));
    });
    expect(alertMock).toHaveBeenCalledWith('privacy.export_alert');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'limits.reset' }));
    });
    expect(screen.getByText('limits.daily:')).toBeInTheDocument();
    expect(screen.getByText('R$ 3,000')).toBeInTheDocument();
    expect(screen.getByText('R$ 30,000')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'security.end_session' }));
    });
    expect(alertMock).toHaveBeenCalledWith('security.end_session_alert');
    expect(screen.queryByText('Safari • iOS')).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'PT' }));
    });
    expect(replaceLocationMock).toHaveBeenCalled();
    expect(replaceLocationMock.mock.calls[0][0]).toContain('/settings?tab=profile&_l=');

    expect(screen.getByRole('link', { name: 'support.help_center' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'legal.terms' })).toHaveAttribute('href', '/docs');
    expect(screen.getByRole('button', { name: 'close.close' })).toBeInTheDocument();
  });
});