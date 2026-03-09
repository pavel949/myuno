/**
 * Centralized placeholder/fallback images for the platform.
 * Single source of truth — never hardcode Unsplash URLs in components.
 */

export const PLACEHOLDER_IMAGES = {
  // Generic fallbacks
  property: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  villa: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  apartment: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
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
  vehicle: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  yacht: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80',
  flower: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80',
  flowerProduct: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=400&q=80',
  pharmacy: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800&q=80',
  pharmacyProduct: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  medical: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  tutor: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
  product: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  babysitter: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  delivery: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80',
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
  document: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  laundry: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800',
  deepClean: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800',
  store: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800',

  // Generic card/image error fallback
  cardFallback: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600&q=80',
  imageFallback: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=60',

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
    'groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    'thai-fashion': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&q=80',
    'cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    'souvenirs': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80',
    'home-decor': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
    'baby-kids': 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
    'health-pharmacy': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    'seafood': 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80',
    'organic': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80',
    'meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
    'drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
    'thai-delicacies': 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&q=80',
  } as Record<string, string>,

  // Service type fallback images (matched by keyword in service name)
  serviceTypes: {
    clean: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    electr: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
    plumb: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    pipe: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    drain: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400',
    beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    spa: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    repair: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    renovat: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
    inspect: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    ac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    water: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    leak: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  } as Record<string, string>,
} as const;

/** Get a fallback image by vertical/type */
export function getPlaceholderImage(type: keyof typeof PLACEHOLDER_IMAGES): string {
  const val = PLACEHOLDER_IMAGES[type];
  return typeof val === 'string' ? val : PLACEHOLDER_IMAGES.service;
}

/** Get service-type image by matching keyword in service name */
export function getServiceFallbackImage(serviceName: string): string {
  const name = serviceName.toLowerCase();
  for (const [key, url] of Object.entries(PLACEHOLDER_IMAGES.serviceTypes)) {
    if (name.includes(key)) return url;
  }
  return PLACEHOLDER_IMAGES.service;
}

/** Get market category image */
export function getMarketCategoryImage(slug: string): string {
  return PLACEHOLDER_IMAGES.marketCategories[slug] || PLACEHOLDER_IMAGES.product;
}
