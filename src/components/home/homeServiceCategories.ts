import type { CategoryEntry } from '@/lib/catalog/taxonomy';
import { publicServiceCategories } from '@/lib/services/publicServiceCategories';
import flowers from '@/assets/home-service-categories/flowers.svg';
import transport from '@/assets/home-service-categories/transport.svg';
import arrival from '@/assets/home-service-categories/arrival.svg';
import home from '@/assets/home-service-categories/home.svg';

const art: Record<string, string> = { flowers, arrival, vehicle: transport, home };
/** Illustration is presentation only; publicServiceCategories owns the one route mapping. */
export function homeServiceCategories(categories: CategoryEntry[]) {
  return publicServiceCategories(categories).map(category => ({ ...category, image: art[category.id] }));
}
