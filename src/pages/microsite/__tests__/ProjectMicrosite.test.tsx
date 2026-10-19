import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ProjectMicrosite from '../ProjectMicrosite';

const state = vi.hoisted(() => ({ enabled: true, insert: vi.fn() }));
vi.mock('@/hooks/useNewbuildProjects', () => ({
  useNewbuildProject: () => ({ isLoading: false, data: {
    id: 'synthetic-project', name_en: 'Synthetic project', name_ru: 'Тестовый проект',
    landing_enabled: state.enabled, project_status: 'under_construction',
    description_ru: 'Описание тестового проекта', location_area: 'Synthetic area',
    price_from: 7234567, construction_progress: 37,
    cover_image: '/synthetic-project.jpg', amenities: ['Synthetic amenity'],
  } }),
}));
vi.mock('@/hooks/useProjectUnits', () => ({ useProjectUnits: () => ({ data: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: state.insert }) } }));
vi.mock('@/components/newbuilds/NbLeadForm', () => ({
  NbLeadForm: ({ projectId, source }: { projectId: string; source: string }) => <div data-testid="lead-form" data-project={projectId} data-source={source} />,
}));

afterEach(cleanup);
beforeEach(() => { state.enabled = true; state.insert.mockClear(); });
function renderMicrosite() {
  return render(<HelmetProvider><MemoryRouter initialEntries={['/p/synthetic-slug']}><Routes>
    <Route path="/p/:slug" element={<ProjectMicrosite />} />
    <Route path="*" element={<p>Canonical project destination</p>} />
  </Routes></MemoryRouter></HelmetProvider>);
}

describe('Project microsite canonical surfaces', () => {
  it('uses existing tokens while preserving project data, links and lead context', () => {
    const { container } = renderMicrosite();
    expect(container.firstElementChild).toHaveClass('nb-theme', 'bg-background', 'text-foreground');
    const cta = screen.getByRole('link', { name: 'Запросить информацию' });
    expect(cta).toHaveAttribute('href', '#lead-form');
    expect(cta).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(screen.getByRole('heading', { level: 1, name: 'Тестовый проект' })).toHaveClass('font-display', 'text-h1');
    expect(screen.getByText(/฿7.2M/).parentElement).toHaveClass('bg-card', 'border-border');
    expect(screen.getByText('37%')).toBeInTheDocument();
    expect(screen.getByText('Описание тестового проекта')).toBeInTheDocument();
    expect(screen.getByTestId('lead-form')).toHaveAttribute('data-project', 'synthetic-project');
    expect(screen.getByTestId('lead-form')).toHaveAttribute('data-source', 'microsite_synthetic-slug');
    expect(container.innerHTML).not.toMatch(/222 47%|38 50%/);
  });
  it('retains the existing explicitly disabled microsite redirect', () => {
    state.enabled = false;
    renderMicrosite();
    expect(screen.getByText('Canonical project destination')).toBeInTheDocument();
    expect(screen.queryByTestId('lead-form')).not.toBeInTheDocument();
  });
});
