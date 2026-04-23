import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Search,
  Plus,
  Minus,
  Heart
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/hooks/useStores';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { StickyCartBar } from '@/components/cart/StickyCartBar';
import { useCartToast } from '@/hooks/useCartToast';
import { MarketComingSoonOverlay } from '@/components/market/MarketComingSoonOverlay';

// TODO: Replace mock product data with database queries
// Products data
const storeProducts: Record<string, Array<{
  id: string;
  nameEn: string;
  nameRu: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  unit: string;
  unitRu: string;
  inStock: boolean;
}>> = {
  'villa-market': [
    { id: 'vm-1', nameEn: 'Organic Avocado', nameRu: 'Органическое авокадо', category: 'fruits', price: 89, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
    { id: 'vm-2', nameEn: 'Australian Beef Steak', nameRu: 'Австралийский стейк', category: 'meat', price: 890, originalPrice: 1100, image: PLACEHOLDER_IMAGES.store, unit: '500g', unitRu: '500г', inStock: true },
    { id: 'vm-3', nameEn: 'French Cheese Selection', nameRu: 'Французские сыры', category: 'dairy', price: 650, image: PLACEHOLDER_IMAGES.store, unit: '300g', unitRu: '300г', inStock: true },
    { id: 'vm-4', nameEn: 'Italian Olive Oil', nameRu: 'Итальянское оливковое масло', category: 'pantry', price: 450, image: PLACEHOLDER_IMAGES.store, unit: '500ml', unitRu: '500мл', inStock: true },
  ],
  'thai-souvenirs': [
    { id: 'ts-1', nameEn: 'Elephant Figurine', nameRu: 'Фигурка слона', category: 'figurines', price: 450, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
    { id: 'ts-2', nameEn: 'Thai Silk Scarf', nameRu: 'Шёлковый шарф', category: 'textiles', price: 890, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
  ],
  'pearl-gallery': [
    { id: 'pg-1', nameEn: 'Pearl Necklace Classic', nameRu: 'Жемчужное ожерелье классика', category: 'necklaces', price: 8900, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
    { id: 'pg-2', nameEn: 'Pearl Earrings Drop', nameRu: 'Серьги с жемчугом капля', category: 'earrings', price: 4500, image: PLACEHOLDER_IMAGES.store, unit: 'pair', unitRu: 'пара', inStock: true },
  ],
  'thai-cosmetics': [
    { id: 'tc-1', nameEn: 'Coconut Oil Hair Mask', nameRu: 'Маска для волос с кокосом', category: 'hair', price: 320, image: PLACEHOLDER_IMAGES.store, unit: '200ml', unitRu: '200мл', inStock: true },
    { id: 'tc-2', nameEn: 'Aloe Vera Gel', nameRu: 'Гель алоэ вера', category: 'skincare', price: 180, image: PLACEHOLDER_IMAGES.store, unit: '250ml', unitRu: '250мл', inStock: true },
  ],
  'home-decor': [
    { id: 'hd-1', nameEn: 'Rattan Pendant Lamp', nameRu: 'Подвесной светильник из ротанга', category: 'lighting', price: 2800, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
  ],
  'thai-silk': [
    { id: 'silk-1', nameEn: 'Silk Sarong', nameRu: 'Шёлковый саронг', category: 'clothing', price: 1500, image: PLACEHOLDER_IMAGES.store, unit: 'piece', unitRu: 'шт', inStock: true },
  ],
  'wine-cellar': [
    { id: 'wine-1', nameEn: 'French Bordeaux Red', nameRu: 'Французское красное Бордо', category: 'wine', price: 1800, image: PLACEHOLDER_IMAGES.store, unit: '750ml', unitRu: '750мл', inStock: true },
  ],
  'thai-sweets': [
    { id: 'sw-1', nameEn: 'Mango Sticky Rice Box', nameRu: 'Манго с клейким рисом', category: 'desserts', price: 180, image: PLACEHOLDER_IMAGES.store, unit: 'box', unitRu: 'коробка', inStock: true },
  ],
  'makro': [
    { id: 'mk-1', nameEn: 'Rice 5kg', nameRu: 'Рис 5 кг', category: 'staples', price: 220, image: PLACEHOLDER_IMAGES.store, unit: '5kg', unitRu: '5кг', inStock: true },
  ],
};

const StoreDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { addItem, removeItem, getItemsByType } = useCart();
  const { store, isLoading } = useStore(id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const { showAddedToast } = useCartToast();

  const products = storeProducts[id || ''] || [];
  const cartItems = getItemsByType('product');

  const getProductQuantity = (productId: string) => {
    const item = cartItems.find(i => i.id === productId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (product: typeof products[0]) => {
    const item = {
      id: product.id,
      type: 'product' as const,
      name: product.nameEn,
      nameRu: product.nameRu,
      price: product.price,
      currency: '฿',
      image: product.image,
      providerId: store?.id,
      providerName: store?.name_en,
      providerNameRu: store?.name_ru,
    };
    addItem(item);
    showAddedToast({ item, cartPath: '/market/checkout' });
  };

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
  };

  const filteredProducts = products.filter(p => 
    searchQuery === '' ||
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nameRu.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
        </div>
      </AppLayout>
    );
  }

  if (!store) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <p>{language === 'ru' ? 'Магазин не найден' : 'Store not found'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-32">
        {/* Hero Image */}
        <div className="relative h-48">
          <img src={store.cover_image || PLACEHOLDER_IMAGES.store} alt={language === 'ru' ? store.name_ru : store.name_en} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur" onClick={() => navigate('/market')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur" onClick={() => setIsFavorite(!isFavorite)}>
                <Heart className={cn("h-5 w-5", isFavorite && "fill-destructive text-destructive")} />
              </Button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl font-bold">{language === 'ru' ? store.name_ru : store.name_en}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span>{store.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{store.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={language === 'ru' ? 'Поиск товаров...' : 'Search products...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Products */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                quantity={getProductQuantity(product.id)}
                onAdd={() => handleAddToCart(product)}
                onRemove={() => handleRemoveFromCart(product.id)}
              />
            ))}
          </div>
        </div>

        <StickyCartBar
          providerId={store?.id}
          checkoutPath="/market/checkout"
          checkoutState={{
            storeId: store?.id,
            storeName: store?.name_en,
            storeNameRu: store?.name_ru,
            deliveryFee: store?.delivery_fee,
            minOrder: store?.min_order_amount,
          }}
        />
        <MarketComingSoonOverlay />
      </div>
    </AppLayout>
  );
};

interface ProductCardProps {
  product: { id: string; nameEn: string; nameRu: string; price: number; originalPrice?: number; image: string; unit: string; unitRu: string; inStock: boolean };
  language: string;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, language, quantity, onAdd, onRemove }) => {
  return (
    <div className="bg-card rounded-none border border-border overflow-hidden">
      <div className="relative aspect-square">
        <img src={product.image} alt={language === 'ru' ? product.nameRu : product.nameEn} className="w-full h-full object-cover" />
        {product.originalPrice && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px]">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{language === 'ru' ? product.nameRu : product.nameEn}</h3>
        <p className="text-xs text-muted-foreground mt-1">{language === 'ru' ? product.unitRu : product.unit}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold">฿{product.price}</span>
          {quantity === 0 ? (
            <Button size="icon" className="h-8 w-8 rounded-full" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={onRemove}><Minus className="h-3 w-3" /></Button>
              <span className="text-sm font-medium w-4 text-center">{quantity}</span>
              <Button size="icon" className="h-7 w-7 rounded-full" onClick={onAdd}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
