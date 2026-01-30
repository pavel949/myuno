import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ship, Compass, Utensils, Scissors, Stethoscope, Dumbbell, Car, Calendar, GraduationCap, Scale, PawPrint, SprayCan, Baby, Flower2, Pill, Shield, Waves, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CatalogServicesTabProps {
  searchQuery: string;
  statusFilter: string;
}

const serviceCategories = [
  { key: 'yachts', label: 'Yachts', labelRu: 'Яхты', icon: Ship, path: '/admin/yachts' },
  { key: 'tours', label: 'Tours', labelRu: 'Туры', icon: Compass, path: '/admin/tours' },
  { key: 'restaurants', label: 'Restaurants', labelRu: 'Рестораны', icon: Utensils, path: '/admin/restaurants' },
  { key: 'salons', label: 'Salons', labelRu: 'Салоны', icon: Scissors, path: '/admin/salons' },
  { key: 'clinics', label: 'Clinics', labelRu: 'Клиники', icon: Stethoscope, path: '/admin/clinics' },
  { key: 'gyms', label: 'Gyms', labelRu: 'Фитнес', icon: Dumbbell, path: '/admin/gyms' },
  { key: 'vehicles', label: 'Transport', labelRu: 'Транспорт', icon: Car, path: '/admin/vehicles' },
  { key: 'events', label: 'Events', labelRu: 'События', icon: Calendar, path: '/admin/events' },
  { key: 'education', label: 'Education', labelRu: 'Образование', icon: GraduationCap, path: '/admin/education' },
  { key: 'legal', label: 'Legal', labelRu: 'Юридические', icon: Scale, path: '/admin/legal' },
  { key: 'pets', label: 'Pets', labelRu: 'Питомцы', icon: PawPrint, path: '/admin/pets' },
  { key: 'cleaning', label: 'Cleaning', labelRu: 'Уборка', icon: SprayCan, path: '/admin/cleaning' },
  { key: 'babysitters', label: 'Babysitters', labelRu: 'Няни', icon: Baby, path: '/admin/babysitters' },
  { key: 'flowers', label: 'Flowers', labelRu: 'Цветы', icon: Flower2, path: '/admin/flowers' },
  { key: 'pharmacies', label: 'Pharmacies', labelRu: 'Аптеки', icon: Pill, path: '/admin/pharmacies' },
  { key: 'insurance', label: 'Insurance', labelRu: 'Страхование', icon: Shield, path: '/admin/insurance' },
  { key: 'water-activities', label: 'Water Sports', labelRu: 'Водные', icon: Waves, path: '/admin/water-activities' },
];

export function CatalogServicesTab({ searchQuery, statusFilter }: CatalogServicesTabProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = serviceCategories.filter(cat => {
    if (selectedCategory !== 'all' && cat.key !== selectedCategory) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return cat.label.toLowerCase().includes(searchLower) || 
             cat.labelRu.toLowerCase().includes(searchLower);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={isRussian ? 'Категория' : 'Category'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все категории' : 'All categories'}</SelectItem>
            {serviceCategories.map(cat => (
              <SelectItem key={cat.key} value={cat.key}>
                {isRussian ? cat.labelRu : cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs">
          {filteredCategories.length} {isRussian ? 'категорий' : 'categories'}
        </Badge>
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredCategories.map((cat) => (
          <Card 
            key={cat.key}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(cat.path)}
          >
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <cat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">
                {isRussian ? cat.labelRu : cat.label}
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <ExternalLink className="h-3 w-3" />
                {isRussian ? 'Открыть' : 'Open'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {isRussian ? 'Категории не найдены' : 'No categories found'}
        </div>
      )}
    </div>
  );
}
