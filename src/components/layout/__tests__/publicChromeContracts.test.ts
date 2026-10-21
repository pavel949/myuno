import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { SURFACE_LANDINGS } from '@/lib/landings/surfaceLandings';
const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
it('keeps catalog header controls in normal flow below the single sticky consumer header', () => {
 const layout = source('src/components/layout/FeatureLayout.tsx');
 expect(layout).not.toContain('sticky top-[var(--consumer-header-height');
 expect(layout).toContain('<div className="relative">\n        <UnifiedHeader');
});
it('hides only the global chat launcher while the consent banner is present', () => {
 expect(source('src/styles/consumer-system.css')).toContain('body:has([data-cookie-consent-banner]) [data-global-chat-launcher]{visibility:hidden;pointer-events:none}');
 expect(source('src/components/chat/UnifiedChatFAB.tsx')).toContain('data-global-chat-launcher');
});
it('provides Thai titles for every canonical footer destination', () => {
 for (const surface of SURFACE_LANDINGS) {
  expect(surface.titleTh).toMatch(/[\u0E00-\u0E7F]/);
 }
 expect(source('src/components/layout/CompactFooter.tsx')).not.toContain("language === 'ru' ? s.titleRu : s.titleEn");
});
