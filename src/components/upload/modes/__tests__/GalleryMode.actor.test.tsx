import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryMode } from '../GalleryMode';
const mocks = vi.hoisted(() => ({ actor: 'actor-a', compress: vi.fn(), upload: vi.fn(), changed: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: mocks.actor } }) }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('browser-image-compression', () => ({ default: mocks.compress }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { storage: { from: () => ({ upload: mocks.upload, getPublicUrl: () => ({ data: { publicUrl: 'https://example.test/photo.webp' } }) }) } } }));
vi.mock('../../ImagePickerFromUrl', () => ({ ImagePickerFromUrl: () => null }));
vi.mock('../../ImageEditor', () => ({ ImageEditor: () => null }));
vi.mock('../../CloudStoragePicker', () => ({ CloudStoragePicker: () => null }));
vi.mock('../../ImageQualityTips', () => ({ ImageQualityTips: () => null }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const image = new File(['synthetic'], 'synthetic.png', { type: 'image/png' });
const props = { value: [], onChange: mocks.changed, enableCloudImport: false, enableUrlImport: false, enableEditing: false, enableQualityTips: false };
beforeEach(() => {
  vi.clearAllMocks(); mocks.actor = 'actor-a'; mocks.compress.mockResolvedValue(image); mocks.upload.mockResolvedValue({ error: null });
  URL.createObjectURL = vi.fn(() => 'blob:synthetic'); URL.revokeObjectURL = vi.fn();
});
describe('gallery actor lifetime', () => {
  it('does not dispatch an old actor upload after compression completes', async () => {
    let finish!: (file: File) => void; mocks.compress.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<GalleryMode {...props} />);
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [image] } });
    await waitFor(() => expect(mocks.compress).toHaveBeenCalledTimes(1));
    mocks.actor = 'actor-b'; view.rerender(<GalleryMode {...props} />);
    await act(async () => { finish(image); });
    expect(mocks.upload).not.toHaveBeenCalled(); expect(mocks.changed).not.toHaveBeenCalled();
  });
  it('does not put a late uploaded URL into the next account form', async () => {
    let finish!: (value: { error: null }) => void; mocks.upload.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const view = render(<GalleryMode {...props} />);
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [image] } });
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1));
    mocks.actor = 'actor-b'; view.rerender(<GalleryMode {...props} />);
    await act(async () => { finish({ error: null }); });
    expect(mocks.changed).not.toHaveBeenCalled();
  });
});
