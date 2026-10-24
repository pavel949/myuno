import React, { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Native top-layer modality also quarantines overlays portaled outside the page. */
function RecheckCurtain({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { language } = useLanguage();
  useLayoutEffect(() => {
    // Retained Radix overlays must not react to an outside click/focus or Escape
    // while the browser makes them inert. Retry uses its ordinary click event.
    const stopRetainedOverlay = (event: Event) => {
      if (event.type === 'keydown' && (event as KeyboardEvent).key !== 'Escape') return;
      if (event.type === 'keydown') event.preventDefault();
      event.stopImmediatePropagation();
    };
    const events = ['pointerdown', 'focusin', 'keydown'] as const;
    events.forEach(name => window.addEventListener(name, stopRetainedOverlay, true));
    const element = dialog.current;
    element?.showModal();
    return () => {
      events.forEach(name => window.removeEventListener(name, stopRetainedOverlay, true));
      element?.close();
    };
  }, []);
  return createPortal(<dialog ref={dialog}
    aria-label={pickLang(language, { en: 'Checking access', ru: 'Проверка доступа', th: 'กำลังตรวจสอบสิทธิ์' })}
    onCancel={event => event.preventDefault()}
    style={{ position: 'fixed', inset: 0, margin: 0, padding: 0, border: 0,
      width: '100vw', height: '100dvh', maxWidth: 'none', maxHeight: 'none',
      background: 'hsl(var(--background, 0 0% 100%))', color: 'hsl(var(--foreground, 222 25% 15%))',
      pointerEvents: 'auto' }}>{children}</dialog>, document.body);
}

/** Retain UI state, never authority, during a same-identity access recheck. */
export function AccessRecheckBoundary({ identity, allowed, pending, fallback, children }: {
  identity: string;
  allowed: boolean;
  pending: boolean;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const admittedIdentity = useRef<string | null>(null);
  const focused = useRef<{ identity: string; element: HTMLElement } | null>(null);
  const wasAllowed = useRef(false);
  // Old browsers without native modality safely unmount as before. Never retain
  // portaled private UI without the browser's top-layer/inert guarantee.
  const canQuarantine = typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function';
  const retain = allowed || (pending && canQuarantine && admittedIdentity.current === identity);
  useLayoutEffect(() => {
    if (allowed) {
      admittedIdentity.current = identity;
      if (!wasAllowed.current && focused.current?.identity === identity && focused.current.element.isConnected) {
        focused.current.element.focus({ preventScroll: true });
      }
    }
    else if (!pending || admittedIdentity.current !== identity) admittedIdentity.current = null;
    wasAllowed.current = allowed;
  }, [identity, allowed, pending]);

  return <>
    <div key={identity} onFocusCapture={event => {
      if (allowed && event.target instanceof HTMLElement) focused.current = { identity, element: event.target };
    }} hidden={!allowed} aria-hidden={!allowed ? true : undefined}
      ref={element => { element?.toggleAttribute('inert', !allowed); }}
      style={{ display: allowed ? 'contents' : 'none' }}>
      {retain ? children : null}
    </div>
    {!allowed && (pending && retain ? <RecheckCurtain>{fallback}</RecheckCurtain> : fallback)}
  </>;
}
