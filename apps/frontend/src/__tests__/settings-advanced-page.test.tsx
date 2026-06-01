import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    title: 'Advanced settings',
  }[key] ?? key),
}));

import SettingsAdvancedPage from '@/app/settings/advanced/page';

describe('SettingsAdvancedPage', () => {
  it('renders without mocked api keys or private key controls', async () => {
    render(<SettingsAdvancedPage />);

    expect(screen.getByText('Advanced settings')).toBeInTheDocument();
    expect(screen.getByText('Carteira')).toBeInTheDocument();
    expect(screen.getByText(/gestão de api keys/i)).toBeInTheDocument();
  });
});
