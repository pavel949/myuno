import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole('button', { name: 'Open parent' }));
    await user.click(screen.getByRole('button', { name: 'Open child' }));
    await user.click(screen.getByRole('button', { name: 'Child action' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Child action' })).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: 'Parent window' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open child' })).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open parent' })).toHaveFocus());
  });

  it('respects a child Escape veto without dismissing its parent', async () => {
    const user = userEvent.setup();
    render(<Fixture preventEscape />);
    await user.click(screen.getByRole('button', { name: 'Open parent' }));
    await user.click(screen.getByRole('button', { name: 'Open child' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Child action' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Parent window' })).toBeInTheDocument();
  });
});