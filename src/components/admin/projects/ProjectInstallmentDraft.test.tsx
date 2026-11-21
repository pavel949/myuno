import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ProjectInstallmentDraft } from './ProjectInstallmentDraft';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('keeps legacy terms unparsed and rejects an incomplete draft without a download', () => {
  const createObjectURL = vi.fn();
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL }));
  render(<ProjectInstallmentDraft language="ru" currentTemplate={[{ privateText: 'SYNTHETIC-OLD-TERMS' }]} />);
  expect(screen.getByText(/У прежних условий другой формат/)).toBeVisible();
  expect(screen.queryByText(/SYNTHETIC-OLD-TERMS/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Скачать черновик' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Проверьте процент');
  expect(createObjectURL).not.toHaveBeenCalled();
});

it('prepares the exact dated commercial draft with no remote write', () => {
  const createObjectURL = vi.fn(() => 'blob:synthetic');
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL: vi.fn() }));
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<ProjectInstallmentDraft language="en" projectId="project-001" />);
  fireEvent.change(screen.getByLabelText('When due'), { target: { value: 'date' } });
  fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2028-02-29' } });
  fireEvent.change(screen.getByLabelText('Share, %'), { target: { value: '25' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add installment' }));
  fireEvent.change(screen.getAllByLabelText('Share, %')[1], { target: { value: '75' } });
  fireEvent.click(screen.getByRole('button', { name: 'Download draft' }));
  expect(createObjectURL).toHaveBeenCalledOnce();
  expect(download).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('makes credit and relative due an explicit operator choice without prefilled currency or units', () => {
  render(<ProjectInstallmentDraft language="en" />);
  fireEvent.change(screen.getByLabelText('When due'), { target: { value: 'after_deposit' } });
  expect(screen.queryByLabelText('Due date')).toBeNull();
  expect(screen.getByLabelText('Time unit')).toHaveValue('');
  expect(screen.getByRole('option', { name: 'Main construction complete' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Roof complete' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /Credit a fixed reservation payment/ }));
  expect(screen.getByLabelText('Reservation credit currency')).toHaveValue('');
  expect(screen.getByText(/not added to the 100% total/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Download draft' }));
  expect(screen.getByRole('alert')).toBeVisible();
});
