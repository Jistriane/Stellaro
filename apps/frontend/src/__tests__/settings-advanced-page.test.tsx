import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  it('renders tabs and allows key interactions in security/api tabs', async () => {
    render(<SettingsAdvancedPage />);

    expect(screen.getByText('Advanced settings')).toBeInTheDocument();
    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText('Wallet Address & Keys')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'API Keys' }));
    await waitFor(() => {
      expect(screen.getByText('Trading Bot')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Revoke' })[0]);
    expect(screen.queryByText('Trading Bot')).not.toBeInTheDocument();
  });
});