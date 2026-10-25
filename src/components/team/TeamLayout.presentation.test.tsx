import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TeamLayout } from './TeamLayout';
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: ReactNode }) => <section>{children}</section> }));
vi.mock('./TeamSidebar', () => ({ TeamSidebar: () => <aside>Existing team sidebar</aside> }));
function Draft() { const [value, setValue] = useState(''); return <input aria-label="Synthetic unsaved draft" value={value} onChange={event => setValue(event.target.value)} />; }
it('keeps workspace draft mounted while named frame/full-width display options change', () => {
 const view = render(<TeamLayout><Draft /></TeamLayout>); const draft = screen.getByLabelText('Synthetic unsaved draft'); fireEvent.change(draft, { target: { value: 'Unsaved synthetic state' } });
 expect(screen.getByRole('main')).toHaveClass('ds-frame', 'ds-frame-container', 'ds-page-with-navigation'); expect(screen.getByRole('main').style.paddingBottom).toBe('');
 view.rerender(<TeamLayout fullWidth><Draft /></TeamLayout>);
 expect(screen.getByLabelText('Synthetic unsaved draft')).toBe(draft); expect(draft).toHaveValue('Unsaved synthetic state'); expect(screen.getByRole('main')).not.toHaveClass('ds-frame-container'); expect(screen.getByText('Existing team sidebar')).toBeVisible();
});
