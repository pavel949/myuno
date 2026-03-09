/**
 * Centralized placeholder/fallback images for the platform.
 * Single source of truth — never hardcode Unsplash URLs in components.
 */

export const PLACEHOLDER_IMAGES = {
  // Generic fallbacks
  property: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  service: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80',
  provider: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  gym: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  insurance: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200',
  pet: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80',
  event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  tour: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  experience: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',

  // District images
  districts: {
    'bang-tao': 'https://images.unsplash.com/photo-1559628233-100c798642d4?w=300',
    'kamala': 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=300',
    'rawai': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=300',
    'surin': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300',
  } as Record<string, string>,

  // Amenity images
  amenities: {
    'pool': 'https://images.unsplash.com/photo-1572331165267-854da2b021aa?w=300',
    'sea-view': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=300',
    'beachfront': 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=300',
    'pet-friendly': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300',
  } as Record<string, string>,

  // Market category images
  marketCategories: {
    'hot': 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&q=80',
    'popular': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    'new': 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80',
  } as Record<string, string>,
} as const;

/** Get a fallback image by vertical/type */
export function getPlaceholderImage(type: keyof typeof PLACEHOLDER_IMAGES): string {
  const val = PLACEHOLDER_IMAGES[type];
  return typeof val === 'string' ? val : PLACEHOLDER_IMAGES.service;
}
