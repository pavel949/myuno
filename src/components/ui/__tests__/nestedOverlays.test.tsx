import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../sheet';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';

afterEach(cleanup);

describe.each(['sheet', 'dialog'] as const)('nested popover in %s', (parent) => {
  function Fixture({ preventEscape = false }: { preventEscape?: boolean }) {
    const Root = parent === 'sheet' ? Sheet : Dialog;
    const Content = parent === 'sheet' ? SheetContent : DialogContent;
    const Title = parent === 'sheet' ? SheetTitle : DialogTitle;
    const Trigger = parent === 'sheet' ? SheetTrigger : DialogTrigger;
    return <Root><Trigger>Open parent</Trigger><Content aria-describedby={undefined}>
      <Title>Parent window</Title>
      <Popover><PopoverTrigger>Open child</PopoverTrigger>
        <PopoverContent onEscapeKeyDown={preventEscape ? (event) => event.preventDefault() : undefined}>
          <button>Child action</button>
        </PopoverContent>
      </Popover>
    </Content></Root>;
  }

  it('closes only the child on first Escape, restores focus, then closes the parent', async () => {
    render(<Fixture />);
    fireEvent.click(screen.getByRole('button', { name: 'Open parent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open child' }));
    fireEvent.click(screen.getByRole('button', { name: 'Child action' }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Child action' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: 'Parent window' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open child' })).toHaveFocus());
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open parent' })).toHaveFocus());
  });

  it('respects a child Escape veto without dismissing its parent', async () => {
    render(<Fixture preventEscape />);
    fireEvent.click(screen.getByRole('button', { name: 'Open parent' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open child' }));
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Child action' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Parent window' })).toBeInTheDocument();
  });
});