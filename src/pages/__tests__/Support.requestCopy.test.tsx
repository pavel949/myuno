import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Support from '../Support';
import { supportCopy } from '@/lib/support/supportCopy';

const state = vi.hoisted(() => ({ language: 'en', openWhatsApp: vi.fn(), startSupportChat: vi.fn() }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => state }));
vi.mock('@/hooks/useChat', () => ({ useSupportChat: () => state }));
vi.mock('@/components/layout/AppLayout', () => ({ AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock('@/components/uno/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/voice-input-button', () => ({ VoiceInputButton: () => null, appendTranscript: (a: string, b: string) => a + b }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Support request guidance', () => {
  it.each(['ru', 'en', 'th'] as const)('renders every revised statement in %s without promises', language => {
    state.language = language;
    render(<MemoryRouter><Support /></MemoryRouter>);
    const copy = supportCopy[language];
    for (const key of ['chatHint', 'managerHint', 'managerDescription', 'requestNote', 'processTitle', 'localTitle', 'localDescription', 'availabilityTitle', 'availabilityDescription'] as const) {
      expect(screen.getByText(copy[key])).toBeInTheDocument();
    }
    for (const step of copy.steps) {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.desc)).toBeInTheDocument();
    }
    expect(document.body.textContent).not.toMatch(/24\/7|around the clock|Our Guarantees|Quality Guarantee|Every partner|final price you see|we.ll refund|Наши гарантии|круглосуточно|вернём деньги|Каждый партнёр|это финальная цена/);
    expect(state.openWhatsApp).not.toHaveBeenCalled();
    expect(state.startSupportChat).not.toHaveBeenCalled();
  });

  it('keeps the English confirmation language explicit', () => {
    expect(supportCopy.en.requestNote).toBe('A request is not a confirmed booking. Provider, time and final price require confirmation.');
    expect(supportCopy.en.steps[3].desc).toBe('Service request prices are estimates. Provider, time and final price require confirmation.');
  });
});
