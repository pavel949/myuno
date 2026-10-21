import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const read = (path: string) => readFileSync(`${process.cwd()}/src/${path}`, 'utf8');
const surfaces = [
  ['pages/services/ServicesIndex.tsx', 'services'],
  ['pages/transport/TransportIndex.tsx', 'transport'],
  ['pages/experiences/ExperiencesIndex.tsx', 'experiences'],
  ['components/market/MarketComingSoonOverlay.tsx', 'market'],
  ['pages/property/OffplanIndex.tsx', 'projects'],
  ['pages/property/OffplanDetail.tsx', 'project'],
  ['pages/property/DevelopersIndex.tsx', 'developers'],
  ['pages/property/PropertySearchPage.tsx', 'search'],
  ['pages/property/PropertyDetail.tsx', 'property'],
  ['pages/services/ServiceFunctionOrder.tsx', 'request'],
  ['pages/property/PropertyInquiry.tsx', 'inquiry'],
];
describe('public commerce visual scope', () => {
  it.each(surfaces)('%s opts into the local visual treatment', (path, variant) => {
    const source = read(path);
    expect(source).toContain("import '@/styles/public-commerce.css'");
    expect(source).toContain(`public-commerce public-commerce--${variant}`);
  });
  it('uses existing theme fonts/colors and does not replace catalogue photos', () => {
    const css = read('styles/public-commerce.css');
    expect(css).toContain('var(--font-display)');
    expect(css).toContain('var(--font-body)');
    expect(css).not.toMatch(/(?:url\(|@import|:root|!important.*color)/);
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
  it('compacts actual home type/area wrappers rather than nested select triggers', () => {
    const css = read('styles/public-commerce.css');
    const search = read('components/home/HomeDiscoverySearch.tsx');
    for (const name of ['home-search-type', 'home-search-location']) expect(search).toContain(`className="${name}"`);
    expect(css).toContain('.home-search > :is(.home-search-type, .home-search-location)');
    expect(css).not.toContain('.home-search > .home-search-select');
  });
  it('keeps request radios round inside their padded clickable labels', () => {
    const css = read('styles/public-commerce.css');
    const radioRule = css.match(/\.public-commerce-form \[role="radio"\] \{([^}]+)\}/)?.[1];
    expect(radioRule).toBeDefined();
    for (const declaration of ['width: 1rem', 'height: 1rem', 'min-height: 1rem', 'flex: 0 0 1rem']) {
      expect(radioRule).toContain(declaration);
    }
    const request = read('pages/services/ServiceFunctionOrder.tsx');
    expect(request).toContain('htmlFor={`time-${slot.value}`}');
    expect(request).toContain('flex items-center gap-2 p-3');
    expect(request).toContain('<RadioGroupItem value={slot.value} id={`time-${slot.value}`} />');
    const primitive = read('components/ui/radio-group.tsx');
    expect(primitive).toContain('RadioGroupPrimitive.Item');
    expect(primitive).toContain('focus-visible:ring-2');
  });
  it('removes dark transport hero without changing submit behavior', () => {
    const hero = read('components/transport/TransportHeroSearch.tsx');
    expect(hero).toContain('public-transport-search relative border-b border-border bg-background text-foreground');
    expect(hero).not.toContain('bg-gradient-to-br');
    expect(hero).toContain('onSearch');
    expect(hero).toContain('<h2 className="public-commerce-title');
  });
});
