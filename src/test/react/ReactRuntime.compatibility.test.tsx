import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from 'react-helmet-async';
import { SEOHead } from '@/components/seo/SEOHead';
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
afterEach(() => { document.title = ''; });

describe('React runtime dependency compatibility', () => {
  it('updates the real public head after a StrictMode rerender', async () => {
    const view = (title: string) => <StrictMode><HelmetProvider><SEOHead title={title} description="Synthetic public description" url="https://www.myuno.app/about" /></HelmetProvider></StrictMode>;
    const { rerender } = render(view('Public catalog'));
    await waitFor(() => expect(document.title).toBe('Public catalog | myUNO'));
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.myuno.app/about');
    rerender(view('Updated catalog'));
    await waitFor(() => expect(document.title).toBe('Updated catalog | myUNO'));
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });
  it('opens and closes the real Vaul drawer without leaving a dialog mounted', async () => {
    render(<StrictMode><Drawer shouldScaleBackground={false}><DrawerTrigger>Open drawer</DrawerTrigger><DrawerContent><DrawerTitle>Account tools</DrawerTitle><DrawerDescription>Available account actions</DrawerDescription><DrawerClose>Close drawer</DrawerClose></DrawerContent></Drawer></StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(await screen.findByRole('dialog', { name: 'Account tools' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('preserves Radix sheet focus restoration through StrictMode mount/unmount', async () => {
    render(<StrictMode><Sheet><SheetTrigger>Open search</SheetTrigger><SheetContent><SheetTitle>Search refinements</SheetTitle><SheetDescription>Optional choices</SheetDescription><SheetClose>Done</SheetClose></SheetContent></Sheet></StrictMode>);
    const trigger = screen.getByRole('button', { name: 'Open search' }); trigger.focus();
    fireEvent.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Search refinements' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
