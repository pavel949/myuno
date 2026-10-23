/**
 * /me/services — MeServices
 * Shared service discovery inside the account shell, without nested chrome
 * or a second services catalogue.
 */
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import ServicesIndex from '@/pages/services/ServicesIndex';
import { MyServiceRequests } from '@/components/services/MyServiceRequests';

export default function MeServices() {
  return <MeShellLayout><MyServiceRequests /><ServicesIndex embedded /></MeShellLayout>;
}
