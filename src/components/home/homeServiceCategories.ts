import type { CategoryEntry } from '@/lib/catalog/taxonomy';
import { publicServiceCategories } from '@/lib/services/publicServiceCategories';
import { serviceDiscoveryMenu } from '@/lib/services/serviceDiscoveryProjection';
import { APP_ROUTES as R } from '@/lib/config/routes';
const flowers = '/catalog/flowers/pink-garden-roses.webp';
import transport from '@/assets/home-service-categories/transport.svg';
import arrival from '@/assets/home-service-categories/arrival.svg';
import home from '@/assets/home-service-categories/home.svg';
const yachtArt = '/yachts/catamaran-53-1.webp';

const art: Record<string, string> = { flowers, arrival, vehicle: transport, home };
/** Category illustrations are navigation, never photographic evidence or availability. */
export function homeServiceCategories(categories: CategoryEntry[]) {
  const rows = publicServiceCategories(categories).map(category => ({ ...category, image: art[category.id] }));
  // Reuse discovery's active parent/child rules. Never turn a static fallback or
  // mismatched route into yacht supply; the caller requires live DB taxonomy.
  const yacht = serviceDiscoveryMenu(categories).yacht;
  if (yacht?.path === R.YACHTS) {
    rows.splice(Math.min(1, rows.length), 0, {
      id: yacht.id,
      path: R.YACHTS,
      labelRu: yacht.labelRu,
      labelEn: yacht.labelEn,
      labelTh: yacht.labelTh || 'เรือยอชต์',
      benefit: {
        ru: 'Яхты и морские прогулки — программы и условия в каталоге',
        en: 'Yachts and boat trips — explore programmes and terms',
        th: 'เรือยอชต์และทริปทางเรือ ดูโปรแกรมและเงื่อนไข',
      },
      image: yachtArt,
      secondary: undefined,
    });
  }
  return rows;
}
