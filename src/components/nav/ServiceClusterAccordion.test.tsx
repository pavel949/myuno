import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ServiceClusterAccordion } from './ServiceClusterAccordion';
import { CLUSTER_CATALOG } from '@/lib/nav/clusterCatalog';

afterEach(cleanup);
describe('compact task navigation', () => {
  it.each([
    ['en', 'Arrive and settle in'], ['ru', 'Приехать и обустроиться'], ['th', 'เดินทางและตั้งถิ่นฐาน'],
  ] as const)('uses plain %s task labels and the existing landing route', (language, label) => {
    const onNavigate = vi.fn();
    const cluster = CLUSTER_CATALOG.find(item => item.id === 'arrive')!;
    render(<ServiceClusterAccordion compact clusters={[cluster]} language={language} onNavigate={onNavigate} sectionTitle="Services" />);
    expect(screen.getAllByRole('button').filter(button => !button.closest('details'))).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(onNavigate).toHaveBeenCalledWith(cluster.homeRoute);
    expect(screen.getByText(language === 'ru' ? 'Выбрать услугу' : language === 'th' ? 'เลือกบริการ' : 'Choose a service').closest('details')).not.toHaveAttribute('open');
  });
  it('does not introduce hidden clusters or expose a cluster containing only unavailable services', () => {
    const cluster = CLUSTER_CATALOG[0];
    render(<ServiceClusterAccordion compact clusters={[{ ...cluster, services: cluster.services.map(service => ({ ...service, status: 'soon' })) }]} language="en" onNavigate={vi.fn()} sectionTitle="Services" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('retains every available Legal destination behind grouped disclosure, including banking', () => {
    const cluster = CLUSTER_CATALOG.find(item => item.id === 'legal')!;
    const onNavigate = vi.fn();
    const { container } = render(<ServiceClusterAccordion compact clusters={[cluster]} language="en" onNavigate={onNavigate} sectionTitle="Services" />);
    const details = container.querySelector('details')!;
    details.open = true;
    const links = cluster.services.filter(service => service.status !== 'soon');
    expect(screen.getAllByRole('button')).toHaveLength(links.length + 1);
    for (const link of links) {
      const label = link.id === 'contract-ai' ? 'Review a contract with AI' : link.labelEn;
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(onNavigate).toHaveBeenLastCalledWith(link.path);
    }
  });
});
