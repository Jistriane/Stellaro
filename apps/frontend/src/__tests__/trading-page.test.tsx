import { render, screen } from '@testing-library/react';
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
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

vi.mock('@/hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => undefined,
}));

import TradingPage from '@/app/trading/page';

describe('TradingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trading page and keeps trading disabled without mock widgets', () => {
    render(<TradingPage />);

    expect(screen.getByText('header.title')).toBeInTheDocument();
    expect(screen.getByText('header.platform_normal')).toBeInTheDocument();
    expect(screen.getByText('intro.title')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Trading está desabilitado neste build para evitar dados simulados/i,
      ),
    ).toBeInTheDocument();
  });
});
