import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const helpTranslations: Record<string, string> = {
  title: 'Help Center',
  subtitle: 'Operational guidance and support.',
  status_title: 'System status',
  status_incidents: 'No incidents reported.',
  search_title: 'Search answers',
  search_placeholder: 'Search help',
  popular: 'Popular questions',
  faq_title: 'FAQ',
  helpful: 'Was this helpful?',
  no_results: 'No help results found.',
  tutorials_title: 'Tutorials',
  tutorials_pix: 'Pix tutorial',
  tutorials_cards: 'Cards tutorial',
  tutorials_denied: 'Access denied tutorial',
  tutorials_docs: 'Documentation',
  support_title: 'Direct support',
  open_chat: 'Open chat',
  email: 'Email',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  hours: '24/7 support',
  protocol: 'Protocol available on request.',
  security_title: 'Security tips',
  sec_tip1: 'Use a strong password.',
  sec_tip2: 'Enable 2FA.',
  sec_tip3: 'Verify wallet addresses.',
  sec_tip4: 'Review connected devices.',
  fraud_docs: 'See anti-fraud guidance in',
  quick_access_title: 'Quick access',
  recover_account: 'Recover account',
  report_suspicious: 'Report suspicious activity',
  cancel_card: 'Cancel card',
  'categories.account.title': 'Account',
  'categories.pix.title': 'Pix',
  'categories.cards.title': 'Cards',
  'categories.kyc.title': 'KYC',
  'categories.gov.title': 'Governance',
  'categories.tokens.title': 'Tokens',
  'categories.account.qas.0.q': 'How do I update my account?',
  'categories.pix.qas.1.q': 'Why is my Pix transfer pending?',
  'categories.cards.qas.0.q': 'How do I freeze my card?',
};

const helpRaw: Record<string, { qas: { q: string; a: string }[] }> = {
  'categories.account': {
    qas: [
      { q: 'How do I update my account?', a: 'Open settings and edit your profile.' },
      { q: 'How can I recover access?', a: 'Use the recovery flow from login.' },
    ],
  },
  'categories.pix': {
    qas: [
      { q: 'How do I register a Pix key?', a: 'Connect your wallet and create a key.' },
      { q: 'Why is my Pix transfer pending?', a: 'Settlement may still be in progress.' },
    ],
  },
  'categories.cards': {
    qas: [
      { q: 'How do I freeze my card?', a: 'Use the cards page controls.' },
    ],
  },
  'categories.kyc': { qas: [{ q: 'How do I complete KYC?', a: 'Send your documents for verification.' }] },
  'categories.gov': { qas: [{ q: 'How do I vote?', a: 'Open the governance module.' }] },
  'categories.tokens': { qas: [{ q: 'Where are my token balances?', a: 'Check wallet and portfolio pages.' }] },
};

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src?: string }) => <img alt={props.alt ?? ''} src={props.src ?? ''} />,
}));

vi.mock('next/link', () => ({
  default: (props: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={props.href} className={props.className}>{props.children}</a>
  ),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translate = ((key: string) => helpTranslations[key] ?? key) as ((key: string) => string) & {
      raw: (key: string) => unknown;
    };
    translate.raw = (key: string) => helpRaw[key];
    return translate;
  },
}));

import HelpPage from '@/app/help/page';

describe('HelpPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders support information, filters FAQ results and keeps support links available', () => {
    render(<HelpPage />);

    expect(screen.getByText('Help Center')).toBeInTheDocument();
    expect(screen.getByText('System status')).toBeInTheDocument();
    expect(screen.getByText('Pix: OK')).toBeInTheDocument();
    expect(screen.getByText('Cards: OK')).toBeInTheDocument();
    expect(screen.getByText('Platform: OK')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open chat' })).toHaveAttribute('href', '/chat');
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/docs');

    fireEvent.click(screen.getByRole('button', { name: 'Why is my Pix transfer pending?' }));
    expect(screen.getAllByText('Why is my Pix transfer pending?').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText('Search help'), { target: { value: 'pending' } });
    expect(screen.getAllByText('Why is my Pix transfer pending?').length).toBeGreaterThan(0);
    expect(screen.queryByText('Account')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search help'), { target: { value: 'no-match-token' } });
    expect(screen.getByText('No help results found.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recover account' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Report suspicious activity' })).toHaveAttribute('href', '/help');
  });
});