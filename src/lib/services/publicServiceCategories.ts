import type { CategoryEntry, ServiceEntry } from '@/lib/catalog/taxonomy';
import { APP_ROUTES as R } from '@/lib/config/routes';

// Presentation and existing route allowlist, not a fallback supply catalogue.
// A card exists only when its active live taxonomy row was returned.
const destinations = [
  { id: 'flowers', path: R.FLOWERS, aliases: ['flowers', 'flower'], labelTh: 'ดอกไม้', benefit: { ru: 'Цветы для подарка или особого повода', en: 'Flowers for a gift or a special occasion', th: 'ดอกไม้สำหรับของขวัญหรือโอกาสพิเศษ' } },
  { id: 'arrival', path: R.AIRPORT_TRANSFER, aliases: ['transfer'], labelTh: 'รถรับส่ง', benefit: { ru: 'Трансфер и проход в аэропорту — отдельные услуги и условия', en: 'Airport transfers and Fast Track have separate terms', th: 'รถรับส่งและฟาสต์แทร็กมีเงื่อนไขแยกกัน' } },
  { id: 'vehicle', path: R.TRANSPORT, aliases: ['vehicle', 'transport'], labelTh: 'รถยนต์และมอเตอร์ไซค์', benefit: { ru: 'Транспорт для поездок по острову', en: 'Transport for getting around the island', th: 'การเดินทางรอบเกาะ' } },
  { id: 'home', path: R.SERVICES, aliases: ['cat-home-services', 'cat-home-living', 'home-services', 'services'], labelTh: 'บริการสำหรับบ้าน', benefit: { ru: 'Повседневные заботы о доме', en: 'Everyday care for your home', th: 'การดูแลบ้านในชีวิตประจำวัน' } },
];
const arrivalLabel = { ru: 'Трансфер и Fast Track', en: 'Transfers & Fast Track', th: 'รถรับส่งและฟาสต์แทร็ก' };
const enabled = (status?: ServiceEntry['status']) => status == null || status === 'available' || status === 'info';

export function publicServiceCategories(categories: CategoryEntry[]) {
  const children = categories.filter(category => enabled(category.status)).flatMap(category => category.services);
  const seen = new Set<string>();
  return destinations.flatMap(destination => {
    const parent = categories.find(category => destination.aliases.includes(category.id) && enabled(category.status));
    const leaf = children.find(service => destination.aliases.includes(service.id) && service.path === destination.path && enabled(service.status));
    const record = parent ?? leaf;
    if (!record || seen.has(destination.path)) return [];
    seen.add(destination.path);
    const fastTrack = destination.id === 'arrival' ? children.find(service => service.id === 'fast-track' && service.path === R.FAST_TRACK && enabled(service.status)) : undefined;
    const label = destination.id === 'arrival' && fastTrack ? arrivalLabel : { ru: destination.id === 'vehicle' ? 'Авто и байки' : record.labelRu, en: destination.id === 'vehicle' ? 'Cars & bikes' : record.labelEn, th: record.labelTh || destination.labelTh };
    return [{ id: destination.id, path: destination.path,
      benefit: destination.id === 'arrival' && !fastTrack ? { ru: 'Поездка из аэропорта — маршрут и условия внутри', en: 'Airport transfers — routes and terms inside', th: 'รถรับส่งสนามบิน ดูเส้นทางและเงื่อนไขด้านใน' } : destination.benefit, labelRu: label.ru, labelEn: label.en, labelTh: label.th,
      secondary: fastTrack ? { path: fastTrack.path, label: { ru: 'Fast Track в аэропорту', en: 'Airport Fast Track', th: 'ฟาสต์แทร็กที่สนามบิน' } } : undefined }];
  });
}
