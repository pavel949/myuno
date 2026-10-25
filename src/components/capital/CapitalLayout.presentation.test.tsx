import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { CapitalLayout } from './CapitalLayout';
const fixture = vi.hoisted(() => ({ mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => fixture.mobile }));
vi.mock('@/components/ui/sidebar', () => ({ SidebarProvider: ({ children }: { children: ReactNode }) => <section>{children}</section>, SidebarInset: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('./CapitalSidebar', () => ({ CapitalSidebar: () => <aside>Capital sidebar</aside> }));
vi.mock('./CapitalHeader', () => ({ CapitalHeader: () => <header>Capital header</header> }));
vi.mock('./CapitalMobileNav', () => ({ CapitalMobileNav: () => <nav>Capital mobile navigation</nav> }));
vi.mock('react-router-dom', () => ({ Outlet: () => { const [value, setValue] = useState(''); return <input aria-label="Synthetic capital draft" value={value} onChange={event => setValue(event.target.value)} />; } }));
it('retains outlet state during viewport changes and delegates bottom spacing to the shared role', () => {
 const view = render(<CapitalLayout />); const draft = screen.getByLabelText('Synthetic capital draft'); fireEvent.change(draft, { target: { value: 'Unsaved capital state' } }); fixture.mobile = true; view.rerender(<CapitalLayout />);
 expect(screen.getByLabelText('Synthetic capital draft')).toBe(draft); expect(draft).toHaveValue('Unsaved capital state'); expect(screen.getByRole('main')).toHaveClass('ds-page-with-navigation'); expect(screen.getByRole('main').style.paddingBottom).toBe(''); expect(screen.getByText('Capital sidebar')).toBeVisible(); expect(screen.getByText('Capital header')).toBeVisible(); expect(screen.getByText('Capital mobile navigation')).toBeVisible();
});
