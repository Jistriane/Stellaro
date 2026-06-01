import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import NotificationsPage from '@/app/notifications/page';

describe('NotificationsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without mocked notifications', async () => {
    render(<NotificationsPage />);

    expect(screen.getAllByText('title').length).toBeGreaterThan(0);
    expect(screen.getByText(/sem histórico\/listagem/i)).toBeInTheDocument();
  });
});
