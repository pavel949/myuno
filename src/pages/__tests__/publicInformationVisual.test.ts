import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const source = (name: string) => readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), 'utf8');
it.each([
 ['Support', '4xl'], ['SOS', '3xl'], ['info/AboutPage', '5xl'],
 ['info/ContactPage', '5xl'], ['info/FAQPage', '4xl'], ['info/PartnersPage', '5xl'],
 ['info/PrivacyPage', '4xl'], ['info/TermsPage', '4xl'],
])('%s has one page gutter and a bounded reading width', (page, width) => {
 expect(source(page)).toContain('usePageContainer={false}');
 expect(source(page)).toContain(`<PageContainer className="max-w-${width}">`);
});
it('gives emergency numbers enough room on mobile without changing their actions', () => {
 expect(source('SOS')).toContain('grid grid-cols-2 sm:grid-cols-4 gap-3');
 expect(source('SOS')).toContain('onClick={() => handleCall(action.phone)}');
});
it('keeps support actions compact on desktop and removes competing panel colors', () => {
 expect(source('Support')).not.toContain('from-success/10 to-success/5');
 expect(source('Support')).not.toContain('from-primary/10 to-primary/5');
 expect(source('Support')).toContain('className="w-full sm:w-auto"');
});
it('uses the display family for owner hierarchy and a plain business hero', () => {
 expect(source('ForOwners')).not.toContain('font-serif');
 expect(source('ForOwners')).toMatch(/<h1 className="[^"]*text-h1 md:text-display font-display/);
 expect(source('ForOwners')).toMatch(/<h2 className="font-display text-h2\b/);
 expect(source('ForOwners')).toMatch(/<h3 className="text-h3 font-display\b/);
 expect(source('ForBusinessPage')).not.toContain('absolute inset-0 bg-gradient-to-br');
});
it('does not draw a second card border around trip search', () => {
 expect(source('TripPlannerPage')).toContain('journey-primary !mb-0 !border-0');
});
