import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Sheet, SheetContent, SheetTitle } from '../sheet';
afterEach(cleanup);
it('forwards the opt-in native overlay click without leaking it onto content', () => {
 const overlayClick = vi.fn();render(<Sheet open><SheetContent onOverlayClick={overlayClick}><SheetTitle>Opt in</SheetTitle><button>Inside</button></SheetContent></Sheet>);
 fireEvent.click(screen.getByRole('button', { name: 'Inside' }));expect(overlayClick).not.toHaveBeenCalled();
 fireEvent.click(document.querySelector('[data-state="open"].inset-0')!);expect(overlayClick).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('dialog')).not.toHaveAttribute('onOverlayClick');
});
it('leaves default sheet overlay click behavior unchanged', () => {
 const change = vi.fn();render(<Sheet open onOpenChange={change}><SheetContent><SheetTitle>Default</SheetTitle></SheetContent></Sheet>);
 fireEvent.click(document.querySelector('[data-state="open"].inset-0')!);expect(change).not.toHaveBeenCalled();expect(screen.getByRole('dialog')).toBeInTheDocument();
});
