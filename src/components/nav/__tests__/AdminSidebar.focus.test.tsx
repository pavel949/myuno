import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => true }));
afterEach(cleanup);

it('returns focus to the mobile sidebar opener after Escape', async () => {
  const onClick = vi.fn();
  render(<SidebarProvider><Sidebar><button>Destination</button></Sidebar><SidebarTrigger onClick={onClick} /></SidebarProvider>);
  const opener = screen.getByRole('button', { name: 'Toggle Sidebar' });
  // Native browser focus-on-click is explicit in this JSDOM setup only.
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(opener).toHaveFocus());
  expect(onClick).toHaveBeenCalledTimes(1);
  fireEvent.click(opener);
  const reopened = await screen.findByRole('dialog');
  fireEvent.keyDown(reopened, { key: 'Escape' });
  await waitFor(() => expect(opener).toHaveFocus());
  expect(onClick).toHaveBeenCalledTimes(2);
});

it('restores the focused field when the keyboard shortcut opened the sidebar', async () => {
  render(<SidebarProvider><Sidebar><button>Destination</button></Sidebar><input aria-label="Work queue search" /><SidebarTrigger /></SidebarProvider>);
  const field = screen.getByRole('textbox', { name: 'Work queue search' });
  field.focus();
  fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
  fireEvent.keyDown(dialog, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(field).toHaveFocus());
});
