import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MeShellLayout } from '../MeShellLayout';
const state = vi.hoisted(() => ({ language: 'ru' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('../AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
beforeEach(() => {
 state.language = 'ru';
 Element.prototype.scrollIntoView = vi.fn();
 Element.prototype.hasPointerCapture = vi.fn(() => false);
 Element.prototype.setPointerCapture = vi.fn();
 Element.prototype.releasePointerCapture = vi.fn();
});
afterEach(cleanup);
function Location() { return <output aria-label="Текущий раздел">{useLocation().pathname}</output>; }
it('reflects the route in the account selector and navigates to an existing section', () => {
 render(<MemoryRouter initialEntries={['/me/services']}><MeShellLayout><Location /></MeShellLayout></MemoryRouter>);
 const selector = screen.getByRole('combobox', { name: 'Раздел аккаунта' });
 expect(selector).toHaveTextContent('Услуги');
 fireEvent.keyDown(selector, { key: 'Enter' });
 fireEvent.click(screen.getByRole('option', { name: 'Документы' }));
 expect(screen.getByLabelText('Текущий раздел')).toHaveTextContent('/me/documents');
 expect(selector).toHaveTextContent('Документы');
});

it('localizes the Thai account selector and section links', () => {
 state.language = 'th';
 render(<MemoryRouter initialEntries={['/me/bookings']}><MeShellLayout><Location /></MeShellLayout></MemoryRouter>);
 expect(screen.getByRole('combobox', { name: 'ส่วนบัญชี' })).toHaveTextContent('การจอง');
 expect(screen.getByRole('navigation', { name: 'ส่วนต่าง ๆ' })).toBeInTheDocument();
 for (const label of ['ภาพรวม', 'การจอง', 'บริการ', 'เอกสาร', 'การชำระเงิน', 'คำขอ', 'โปรไฟล์']) expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
 fireEvent.keyDown(screen.getByRole('combobox', { name: 'ส่วนบัญชี' }), { key: 'Enter' });
 fireEvent.click(screen.getByRole('option', { name: 'เอกสาร' }));
 expect(screen.getByLabelText('Текущий раздел')).toHaveTextContent('/me/documents');
});
