/**
 * /me/services — MeServices
 * Shared service discovery inside the account shell, without nested chrome
 * or a second services catalogue.
 */
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { ServiceDiscoveryContent } from '@/components/navigation/ServiceDiscovery';

export default function MeServices() {
  return <MeShellLayout><ServiceDiscoveryContent /></MeShellLayout>;
}
