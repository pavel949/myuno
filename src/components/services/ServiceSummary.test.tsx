import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ServiceCard } from './PopularServicesSection';
import { ClusterAppCard } from '@/components/uno/ClusterAppCard';
import { Wrench } from 'lucide-react';
import type { Service } from '@/hooks/useServices';

vi.mock('@/contexts/LanguageContext', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/useServices', () => ({ useServices: () => ({ services: [], isLoading: false }) }));
const service = { id: 'fixture', name_en: 'Fixture service', description_en: 'Existing scope', price: 30, currency: 'USD', duration_minutes: 45 } as Service;

describe('shared service presentation preserves capabilities', () => {
  it('shows real scope and currency with a single details action and no invented photo', () => {
    const onClick = vi.fn();
    render(<ServiceCard service={service} onClick={onClick} />);
    expect(screen.getByText('Existing scope')).toBeVisible();
    expect(screen.getByText('USD 30')).toBeVisible();
    expect(screen.getByText('45 min')).toBeVisible();
    expect(screen.queryByRole('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /View service/ }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('keeps informational navigation distinct from professional access', () => {
    render(<MemoryRouter><ClusterAppCard clusterId="live" icon={Wrench} title="Fixture" description="Scope" path="/services?category=cleaning" status="info" /></MemoryRouter>);
    expect(screen.getByText('Information')).toBeVisible();
    expect(screen.queryByText('Professional')).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/services?category=cleaning');
  });
});
