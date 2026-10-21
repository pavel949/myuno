import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminSettingsStep } from './AdminSettingsStep';
const state = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/hooks/useSoundEffects', () => ({ playSound: vi.fn(), isTypingKey: () => false }));
vi.mock('@/hooks/useHapticFeedback', () => ({ triggerHaptic: vi.fn() }));
afterEach(cleanup);
beforeEach(() => { state.language = 'en'; });

describe('admin property publication settings', () => {
  it('preserves and displays a draft without implicitly submitting or activating it', () => {
    const change = vi.fn();
    render(<AdminSettingsStep data={{ approval_status: 'draft', is_active: false }} onChange={change} />);
    expect(screen.getByRole('combobox', { name: 'Approval status' })).toHaveTextContent('Draft');
    expect(screen.getByRole('switch', { name: 'Active' })).not.toBeChecked();
    expect(screen.getByText(/Only active, approved properties appear in the catalog/)).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('switch', { name: 'Active' }));
    expect(change).toHaveBeenCalledWith({ is_active: true });
  });
  it('keeps rejection feedback editable and exposes the exact persisted reason', () => {
    const change = vi.fn();
    render(<AdminSettingsStep data={{ approval_status: 'rejected', rejection_reason: 'Photo missing' }} onChange={change} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Rejection reason' }), { target: { value: 'Add a cover photo' } });
    expect(change).toHaveBeenCalledWith({ rejection_reason: 'Add a cover photo' });
  });
  it('localizes the publication controls and draft state in Russian', () => {
    state.language = 'ru';
    render(<AdminSettingsStep data={{ approval_status: 'draft', is_active: false }} onChange={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Статус модерации' })).toHaveTextContent('Черновик');
    expect(screen.getByRole('switch', { name: 'Активен' })).not.toBeChecked();
    expect(screen.getByText(/В каталоге отображаются только активные одобренные объекты/)).toBeInTheDocument();
  });
});

it('localizes draft and publication guidance in Thai', () => {
  state.language = 'th';
  render(<AdminSettingsStep data={{ approval_status: 'draft', is_active: false }} onChange={vi.fn()} />);
  expect(screen.getByRole('combobox', { name: 'สถานะการอนุมัติ' })).toHaveTextContent('ฉบับร่าง');
  expect(screen.getByRole('switch', { name: 'ใช้งาน' })).not.toBeChecked();
  expect(screen.getByText(/แคตตาล็อกแสดงเฉพาะที่พักที่ใช้งานและอนุมัติแล้ว/)).toBeInTheDocument();
});
