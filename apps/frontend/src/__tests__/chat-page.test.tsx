import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
      if (key === 'suggestions') {
        return ['pix support', 'card help'];
      }
      return [];
    };
    return translate;
  },
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

import ChatPage from '@/app/chat/page';

describe('ChatPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-30T10:58:00Z'));
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders initial chat state and replies to a quick suggestion', async () => {
    render(<ChatPage />);

    expect(screen.getByText('header_title')).toBeInTheDocument();
    expect(screen.getByText('conversation')).toBeInTheDocument();
    expect(screen.getByText('status_online')).toBeInTheDocument();
    expect(screen.getByText('assistant_started {"name":"Jistriane"}')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pix support' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'card help' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'pix support' }));

    expect(screen.getByText('typing')).toBeInTheDocument();
    expect(screen.getAllByText('pix support')).toHaveLength(2);

    await act(async () => {
      vi.advanceTimersByTime(801);
    });

    expect(screen.getByText('assistant_reply {"text":"pix support"}')).toBeInTheDocument();

    expect(screen.getByText('hint_pix')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'links.articles' })).toHaveAttribute('href', '/docs');
  });
});