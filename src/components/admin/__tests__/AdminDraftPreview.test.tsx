import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminDraftPreview } from '../AdminDraftPreview';

afterEach(cleanup);

it('opens within an editor without submitting and displays current text as plain text', () => {
  const submit = vi.fn();
  const { rerender, container } = render(
    <form onSubmit={submit}><AdminDraftPreview language="en" title="Old draft" /></form>
  );
  const details = container.querySelector('details')!;
  expect(details.open).toBe(false);
  fireEvent.click(screen.getByText('Preview draft'));
  expect(details.open).toBe(true);
  const draft = '<img src="https://example.invalid/private.png">';
  rerender(<form onSubmit={submit}><AdminDraftPreview language="en" title="New draft" description={draft} /></form>);
  expect(screen.getByText('New draft')).toBeInTheDocument();
  expect(screen.getByText(draft)).toBeInTheDocument();
  expect(container.querySelector('img,iframe,a')).toBeNull();
  expect(submit).not.toHaveBeenCalled();
});

it.each([
  ['ru', 'Предпросмотр черновика', 'Название ещё не указано'],
  ['th', 'ดูตัวอย่างฉบับร่าง', 'ยังไม่มีชื่อ'],
] as const)('localizes the empty draft for %s', (language, label, placeholder) => {
  render(<AdminDraftPreview language={language} title="   " />);
  fireEvent.click(screen.getByText(label));
  expect(screen.getByText(placeholder)).toBeInTheDocument();
});
