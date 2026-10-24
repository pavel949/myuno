import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { APP_ROUTES as R } from '@/lib/config/routes';
import flowers from '@/assets/home-service-categories/flowers.svg';
import transport from '@/assets/home-service-categories/transport.svg';
import yacht from '@/assets/home-service-categories/yacht.svg';
import home from '@/assets/home-service-categories/home.svg';

// Presentation and existing route allowlist, not a fallback supply catalogue.
// A card exists only when its active live taxonomy row was returned.
const destinations = [
  { id: 'flowers', path: R.FLOWERS, aliases: ['flowers', 'flower'], image: flowers, labelTh: 'ดอกไม้', benefit: { ru: 'Цветы для подарка или особого повода', en: 'Flowers for a gift or a special occasion', th: 'ดอกไม้สำหรับของขวัญหรือโอกาสพิเศษ' } },
  { id: 'vehicle', path: R.TRANSPORT, aliases: ['vehicle', 'transport'], image: transport, labelTh: 'รถยนต์และมอเตอร์ไซค์', benefit: { ru: 'Транспорт для поездок по острову', en: 'Transport for getting around the island', th: 'การเดินทางรอบเกาะ' } },
  { id: 'yacht', path: R.YACHTS, aliases: ['yacht', 'yachts'], image: yacht, labelTh: 'เรือยอชต์', benefit: { ru: 'Для отдыха на воде', en: 'For time out on the water', th: 'สำหรับการพักผ่อนบนผืนน้ำ' } },
  { id: 'home', path: R.SERVICES, aliases: ['cat-home-services', 'cat-home-living', 'home-services', 'services'], image: home, labelTh: 'บริการสำหรับบ้าน', benefit: { ru: 'Повседневные заботы о доме', en: 'Everyday care for your home', th: 'การดูแลบ้านในชีวิตประจำวัน' } },
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
      benefit: destination.benefit, labelRu: record.labelRu, labelEn: record.labelEn, labelTh: record.labelTh || destination.labelTh }];
  });
}
