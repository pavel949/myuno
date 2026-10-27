import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { LandingContainer } from './LandingPrimitives';
import { LandingChrome } from './LandingChrome';
import { PUBLIC_CONTENT_LAYOUT } from '@/design-system/ecosystemLayout';

vi.mock('@/components/uno/BrandWordmark', () => ({ BrandWordmark: () => <span>myUNO</span> }));
vi.mock('@/components/uno/GlobalPreferencesControls', () => ({ GlobalPreferencesControls: () => <span>Preferences</span> }));
afterEach(cleanup);
const source = (name: string) => readFileSync(resolve(process.cwd(), `src/pages/${name}.tsx`), 'utf8');

it('keeps default landing bounds and opts marketing content and chrome into the same frame', () => {
  const { container } = render(<MemoryRouter>
    <LandingContainer>Default content</LandingContainer>
    <LandingContainer variant="marketing">Marketing content</LandingContainer>
    <LandingChrome isRu={false} />
    <LandingChrome isRu={false} variant="marketing" />
  </MemoryRouter>);
  expect(screen.getByText('Default content')).toHaveClass('max-w-6xl', 'px-5');
  const marketing = screen.getByText('Marketing content');
  for (const token of PUBLIC_CONTENT_LAYOUT.marketing.split(' ')) expect(marketing).toHaveClass(token);
  const headers = container.querySelectorAll('header > div');
  expect(headers[0]).toHaveClass('max-w-6xl', 'px-4', 'sm:px-5');
  for (const token of PUBLIC_CONTENT_LAYOUT.marketing.split(' ')) expect(headers[1]).toHaveClass(token);
  expect(headers[1]).not.toHaveClass('max-w-6xl', 'sm:px-5');
  for (const header of headers) {
    expect(header).toHaveClass('h-14', 'items-center');
    expect(header).not.toHaveClass('flex-wrap');
  }
  expect(screen.getAllByRole('link', { name: 'Get started' })).toHaveLength(2);
});

it.each(['ForManagementCompanies', 'ForLocalServices'])('%s owns one explicit frame and canonical hero type', page => {
  const text = source(page);
  expect(text).toContain('<AppLayout usePageContainer={false} showHeader={false}>');
  expect(text).toContain('<LandingChrome isRu={isRu} variant="marketing" />');
  expect(text).toMatch(/<h1 className="text-h1 md:text-display font-display/);
  expect(text).toContain('text-body-lg');
  expect(text).toContain('<LandingContainer variant="marketing"');
  expect(text).not.toMatch(/<LandingContainer[^>]*max-w-/);
  expect(text).not.toMatch(/<section[^>]*px-4/);
  expect(text).toContain("const isRu = language === 'ru'");
});

it('retains MC pricing, trial queries and section destinations', () => {
  const text = source('ForManagementCompanies');
  for (const value of [199, 399, 799]) expect(text).toContain(`priceUsd: ${value}`);
  expect(text).toContain('/auth?redirect=/mc/onboarding&trial=true');
  expect(text).toContain("'/auth?redirect=/mc/onboarding&trial=true&tier=' + tier.id");
  expect(text).toContain('id="pricing"');
  expect(text).toContain('id={`module-${m.id}`}');
  expect(text).toContain('href={`#module-${m.id}`}');
  expect(text).toContain('scroll-mt-28');
  expect(text).toContain('overflow-x-auto');
  expect(text).toContain('grid sm:grid-cols-2 lg:grid-cols-3');
  expect(text).toContain('grid md:grid-cols-3');
});

it('retains developer and provider destinations and existing commercial copy', () => {
  const developers = source('ForDevelopers');
  expect(developers).toContain('<AudienceLanding');
  expect(developers).toContain('APP_ROUTES.DEVELOPER_PORTAL_APPLY');
  expect(developers).toContain('APP_ROUTES.DEVELOPER_PORTAL_PROJECTS');
  expect(developers).not.toContain('48 hours');
  expect(developers).not.toContain('No hidden fees');
  const providers = source('ForLocalServices');
  expect(providers).toContain('grid grid-cols-1 sm:grid-cols-2');
  expect(providers).toContain('flex flex-col sm:flex-row');
  for (const route of ['VENDOR_JOIN', 'FOR_BUSINESS', 'BECOME_PARTNER', 'LIST_WITH_US']) {
    expect(providers).toContain(`navigate(APP_ROUTES.${route})`);
  }
  expect(providers).toContain('Residents, tourists, and concierge route requests to verified partners.');
});
