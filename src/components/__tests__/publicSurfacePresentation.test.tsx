import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TrustStrip } from '@/components/property/TrustStrip';
import { SignupIntegrityModal, type IntegrityReport } from '@/components/auth/SignupIntegrityModal';
import { GalleryMode } from '@/components/upload/modes/GalleryMode';

const boundary = vi.hoisted(() => ({ invoke: vi.fn(() => { throw new Error('Live transport forbidden'); }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: boundary.invoke } } }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/components/clearview/ClearViewBadge', () => ({ ClearViewBadge: ({ grade }: { grade: string }) => <span>Grade {grade}</span> }));
vi.mock('@/components/clearview/ClearViewBadgePopover', () => ({ ClearViewBadgePopover: () => null }));
vi.mock('@/components/upload/ImagePickerFromUrl', () => ({ ImagePickerFromUrl: () => null }));
vi.mock('@/components/upload/CloudStoragePicker', () => ({ CloudStoragePicker: () => null }));
vi.mock('@/components/upload/ImageEditor', () => ({ ImageEditor: () => <div data-testid="editor-boundary" /> }));
vi.mock('@/components/upload/ImageQualityTips', () => ({ ImageQualityTips: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

const complete: IntegrityReport = { ok: true, profile_exists: true, phone_saved: true, phone_matches: true, terms_accepted: true, privacy_accepted: true, warnings: [] };
const modalProps = { open: true, onClose: vi.fn(), userId: null, expectedPhone: null, initialError: null, emailConfirmationRequired: false, language: 'en' as const };

describe('trust presentation preserves evidence and status meaning', () => {
  it('does not manufacture chips when evidence is absent or unknown', () => {
    const { container } = render(<TrustStrip isRu={false} floodRisk="unknown" clearviewRecommendation="unknown" ownerVerified={false} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('keeps high risk informational, with danger rather than destructive-action presentation', () => {
    render(<TrustStrip isRu={false} floodRisk="high" clearviewRecommendation="AVOID" />);
    expect(screen.getByText('High flood risk').parentElement).toHaveClass('text-danger');
    expect(screen.getByText('AVOID').parentElement).toHaveClass('text-danger');
    expect(screen.getByText('AVOID').parentElement).not.toHaveClass('text-destructive');
  });
  it('preserves quota thresholds and negative-availability clamping', () => {
    const { rerender } = render(<TrustStrip isRu={false} foreignQuota={{ available: 5, total: 10 }} />);
    expect(screen.getByText('Foreign quota: 5/10').parentElement).toHaveClass('text-success');
    rerender(<TrustStrip isRu={false} foreignQuota={{ available: 2, total: 10 }} />);
    expect(screen.getByText('Foreign quota: 2/10').parentElement).toHaveClass('text-warning');
    rerender(<TrustStrip isRu={false} foreignQuota={{ available: -1, total: 10 }} />);
    expect(screen.getByText('Foreign quota: 0/10').parentElement).toHaveClass('text-danger');
  });
});

describe('signup report presentation preserves truth boundaries', () => {
  it('does not show a saved-success banner without a report or invoke transport for no actor', () => {
    render(<SignupIntegrityModal {...modalProps} initialReport={null} />);
    expect(screen.queryByText('All data saved.')).not.toBeInTheDocument();
    expect(boundary.invoke).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
  });
  it('distinguishes the existing incomplete warning from saved success', () => {
    const { rerender } = render(<SignupIntegrityModal {...modalProps} initialReport={{ ...complete, ok: false, phone_saved: false }} />);
    expect(screen.getByText('Some data is missing — refresh or contact support.')).toHaveClass('text-warning');
    rerender(<SignupIntegrityModal {...modalProps} initialReport={complete} />);
    expect(screen.getByText('All data saved.')).toHaveClass('text-success');
    expect(boundary.invoke).not.toHaveBeenCalled();
  });
});

describe('gallery controls retain existing authoring behavior', () => {
  it('removes only the selected local item, preserving remaining order without upload transport', () => {
    const onChange = vi.fn();
    render(<GalleryMode value={['first.jpg', 'second.jpg', 'third.jpg']} onChange={onChange} enableCloudImport={false} enableUrlImport={false} enableQualityTips={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 2' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['first.jpg', 'third.jpg']);
    expect(screen.getByText('Cover')).toBeInTheDocument();
    expect(boundary.invoke).not.toHaveBeenCalled();
  });
  it('retains the existing disabled-editing gate', () => {
    render(<GalleryMode value={['first.jpg']} onChange={vi.fn()} enableEditing={false} enableCloudImport={false} enableUrlImport={false} enableQualityTips={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit photo 1' }));
    expect(screen.queryByTestId('editor-boundary')).not.toBeInTheDocument();
    expect(boundary.invoke).not.toHaveBeenCalled();
  });
});
