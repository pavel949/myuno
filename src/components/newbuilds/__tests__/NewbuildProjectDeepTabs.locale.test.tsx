import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewbuildProjectDeepTabs } from '../NewbuildProjectDeepTabs';
import type { NewbuildProject } from '@/hooks/useNewbuildProjects';
const locale = vi.hoisted(() => ({ language: 'en' }));
vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => locale }));
vi.mock('@/components/newbuilds/NbProjectStatusBadge', () => ({ NbProjectStatusBadge: () => null }));
vi.mock('@/components/newbuilds/NbConstructionProgress', () => ({ NbConstructionProgress: () => null }));
vi.mock('@/components/newbuilds/NbPriceDisplay', () => ({ NbPriceDisplay: () => null }));
vi.mock('@/components/newbuilds/NbLeadForm', () => ({ NbLeadForm: () => null }));
vi.mock('@/components/newbuilds/NbROICalculator', () => ({ NbROICalculator: () => null }));
vi.mock('@/components/newbuilds/NbServicesSection', () => ({ NbServicesSection: () => null }));
vi.mock('@/components/newbuilds/PublicFloorPlan', () => ({ PublicFloorPlan: () => null }));
vi.mock('@/components/newbuilds/ProjectUnitsGrid', () => ({ ProjectUnitsGrid: () => null }));
vi.mock('@/components/newbuilds/ProjectDealsTab', () => ({ ProjectDealsTab: () => null }));
vi.mock('@/components/newbuilds/ProjectMarketingTab', () => ({ ProjectMarketingTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbInventoryTab', () => ({ NbInventoryTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbPlansTab', () => ({ NbPlansTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbTermsTab', () => ({ NbTermsTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbUpdatesTab', () => ({ NbUpdatesTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbReportsTab', () => ({ NbReportsTab: () => null }));
vi.mock('@/components/newbuilds/tabs/NbDeveloperTab', () => ({ NbDeveloperTab: () => null }));
afterEach(cleanup);
describe('project details locale', () => {
  it.each([
    ['en', 'Project details', 'Availability', 'Floor plans', 'Developer', 'Total units'],
    ['ru', 'Полная карточка проекта', 'Доступность', 'Планировки', 'О девелопере', 'Всего юнитов'],
    ['th', 'รายละเอียดโครงการ', 'ห้องที่ว่าง', 'แปลนห้อง', 'ผู้พัฒนา', 'ยูนิตทั้งหมด'],
  ])('uses %s labels throughout the visible overview', (language, title, available, plans, developer, units) => {
    locale.language = language;
    const project = { id: 'p', name_en: 'Project', description_en: 'English project description', description_ru: 'Описание проекта на русском', total_units: 20, amenities: ['11_villas', '2452+_sqm'] } as NewbuildProject;
    render(<NewbuildProjectDeepTabs project={project} variant="embedded" />);
    for (const label of [title, plans, developer, units, '11 villas', '2452+ sqm']) expect(screen.getByText(label)).toBeVisible();
    expect(screen.queryByText(available)).toBeNull();
    expect(screen.getByText(language === 'ru' ? 'Описание проекта на русском' : 'English project description')).toBeVisible();
    if (language !== 'ru') expect(screen.queryByText('Полная карточка проекта')).toBeNull();
  });
});
