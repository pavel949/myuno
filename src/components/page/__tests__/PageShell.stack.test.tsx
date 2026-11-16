import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PageShell } from '../PageShell';
afterEach(cleanup);
it('preserves mounted drafts and focus while switching the visual stack density', () => {
  const content=<input aria-label="Synthetic unsaved draft" defaultValue="" />;
  const { rerender }=render(<PageShell stack="default">{content}</PageShell>);
  const field=screen.getByRole('textbox',{name:'Synthetic unsaved draft'});
  fireEvent.change(field,{target:{value:'Keep this draft'}});field.focus();
  rerender(<PageShell stack="compact">{content}</PageShell>);
  expect(screen.getByRole('textbox')).toBe(field);expect(field).toHaveValue('Keep this draft');expect(field).toHaveFocus();
  rerender(<PageShell>{content}</PageShell>);
  expect(screen.getByRole('textbox')).toBe(field);expect(field).toHaveValue('Keep this draft');expect(field).toHaveFocus();
});
