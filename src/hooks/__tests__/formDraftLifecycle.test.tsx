import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormDraft } from '../useFormDraft';

const initialData = { name: '', price: '' };
const storageKey = 'vendor_draft_synthetic-service';
function mount() {
  return renderHook(() => useFormDraft({ key: 'synthetic-service', initialData, debounceMs: 100 }));
}
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', () => { throw new Error('Production network denied'); });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });

describe('data-entry draft lifecycle', () => {
  it('does not create an empty draft merely by opening a form', () => {
    const { result } = mount();
    act(() => { vi.advanceTimersByTime(101); });
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });

  it('persists and restores meaningful entries', () => {
    const first = mount();
    act(() => { first.result.current.updateField('name', 'Synthetic service'); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(first.result.current.hasDraft).toBe(true);
    first.unmount();
    const second = mount();
    expect(second.result.current.formData.name).toBe('Synthetic service');
  });

  it('discard cancels pending autosave so the draft cannot reappear', () => {
    const { result } = mount();
    act(() => { result.current.updateField('name', 'Unsaved input'); });
    act(() => { result.current.clearDraft(); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });

  it('manual edits back to initial values remove older saved input', () => {
    const first = mount();
    act(() => { first.result.current.updateField('name', 'Erased service'); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(JSON.parse(localStorage.getItem(storageKey)!).name).toBe('Erased service');

    act(() => { first.result.current.updateField('name', ''); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(first.result.current.hasDraft).toBe(false);
    expect(first.result.current.lastSaved).toBeNull();
    first.unmount();

    const second = mount();
    expect(second.result.current.formData).toEqual(initialData);
  });

  it('preserves an existing meaningful draft on initial mount', () => {
    const saved = { ...initialData, name: 'Existing service' };
    localStorage.setItem(storageKey, JSON.stringify(saved));
    const { result } = mount();
    expect(result.current.formData).toEqual(saved);
    expect(result.current.hasDraft).toBe(true);
    act(() => { vi.advanceTimersByTime(101); });
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(saved);
  });

  it('successful reset clears persisted input without recreating an empty draft', () => {
    const { result } = mount();
    act(() => { result.current.updateField('name', 'Saved input'); });
    act(() => { vi.advanceTimersByTime(101); });
    act(() => { result.current.resetForm(); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(result.current.formData).toEqual(initialData);
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.lastSaved).toBeNull();
  });

  it('new edits after discard still autosave', () => {
    const { result } = mount();
    act(() => { result.current.updateField('name', 'Old input'); });
    act(() => { result.current.clearDraft(); });
    act(() => { result.current.updateField('name', 'New input'); });
    act(() => { vi.advanceTimersByTime(101); });
    expect(JSON.parse(localStorage.getItem(storageKey)!).name).toBe('New input');
  });
});

