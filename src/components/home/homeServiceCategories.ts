import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { APP_ROUTES as R } from '@/lib/config/routes';
import flowers from '@/assets/home-service-categories/flowers.svg';
import transport from '@/assets/home-service-categories/transport.svg';
import yacht from '@/assets/home-service-categories/yacht.svg';
import home from '@/assets/home-service-categories/home.svg';

// Presentation and existing route allowlist, not a fallback supply catalogue.
// A card exists only when its active live taxonomy row was returned.
const destinations = [
  { id: 'flowers', path: R.FLOWERS, aliases: ['flowers', 'flower'], image: flowers, labelTh: 'ดอกไม้' },
  { id: 'vehicle', path: R.TRANSPORT, aliases: ['vehicle', 'transport'], image: transport, labelTh: 'รถยนต์และมอเตอร์ไซค์' },
  { id: 'yacht', path: R.YACHTS, aliases: ['yacht', 'yachts'], image: yacht, labelTh: 'เรือยอชต์' },
  { id: 'home', path: R.SERVICES, aliases: ['cat-home-services', 'cat-home-living', 'home-services', 'services'], image: home, labelTh: 'บริการสำหรับบ้าน' },
];
const enabled = (status?: ServiceEntry['status']) => status == null || status === 'available' || status === 'info';

export function homeServiceCategories(categories: CategoryEntry[]) {
  const children = categories.filter(category => enabled(category.status)).flatMap(category => category.services);
  const seen = new Set<string>();
  return destinations.flatMap(destination => {
    const parent = categories.find(category => destination.aliases.includes(category.id) && enabled(category.status));
    const leaf = children.find(service => destination.aliases.includes(service.id) && service.path === destination.path && enabled(service.status));
    const record = parent ?? leaf;
    if (!record || seen.has(destination.path)) return [];
    seen.add(destination.path);
    return [{ id: destination.id, path: destination.path, image: destination.image,
      labelRu: record.labelRu, labelEn: record.labelEn, labelTh: record.labelTh || destination.labelTh }];
  });
}
