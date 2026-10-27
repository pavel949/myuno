import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { HostProfileSection } from '../HostProfileSection';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
it('presents only the persisted manager name without a host achievement claim', () => {
  render(<HostProfileSection rentalTerms={{ manager_name: 'Synthetic manager' }} />);
  expect(screen.getByText('Manager: Synthetic manager')).toBeInTheDocument();
  expect(screen.queryByText('Superhost')).toBeNull();
});
