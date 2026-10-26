/** Compatibility entry: the public hub and embedded catalogue share one implementation. */
import ServicesIndex from '@/pages/services/ServicesIndex';
export function ServiceDiscoveryContent() { return <ServicesIndex embedded />; }
export default ServicesIndex;
