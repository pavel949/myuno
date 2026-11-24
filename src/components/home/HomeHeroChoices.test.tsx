import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeHeroChoices } from './HomeHeroChoices';

const fixture = vi.hoisted(() => ({ language: 'en' as 'en' | 'ru' | 'th' }));
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ language: fixture.language }),
}));
afterEach(cleanup);

describe('HomeHeroChoices', () => {
  it.each([
    ['en', 'Rent a home', 'Buy property', 'Experiences', 'Find a service'],
    ['ru', 'Снять жильё', 'Купить недвижимость', 'Впечатления', 'Найти услугу'],
    ['th', 'เช่าที่พัก', 'ซื้ออสังหาริมทรัพย์', 'ประสบการณ์', 'ค้นหาบริการ'],
  ] as const)('opens the four canonical marketplace entries in %s', (language, rent, buy, experiences, services) => {
    fixture.language = language;
    render(<MemoryRouter><HomeHeroChoices /></MemoryRouter>);

    const choices = within(screen.getByRole('group'));
    expect(choices.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
      '/property/rent', '/discover/buy', '/experiences', '/services', '/discover',
    ]);
    for (const label of [rent, buy, experiences, services]) {
      expect(choices.getByRole('link', { name: new RegExp('^' + label) })).toBeVisible();
    }
  });
});
