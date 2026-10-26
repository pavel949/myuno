import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ServiceDiscovery, { ServiceDiscoveryContent } from '../ServiceDiscovery';
import ServicesIndex from '@/pages/services/ServicesIndex';
vi.mock('@/pages/services/ServicesIndex', () => ({ default: ({ embedded }: { embedded?: boolean }) => <p>{embedded ? 'shared embedded catalogue' : 'shared public catalogue'}</p> }));
describe('legacy discovery entry compatibility', () => {
  it('uses the same public implementation', () => { expect(ServiceDiscovery).toBe(ServicesIndex); });
  it('uses the same embedded implementation', () => { render(<ServiceDiscoveryContent />); expect(screen.getByText('shared embedded catalogue')).toBeVisible(); });
});
