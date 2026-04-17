/**
 * PropertyDetailHighlights — Airbnb-style quick highlights row
 * (property type, view, instant booking, project info).
 */
import { Home, Eye, Zap, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ViewLabel {
  en: string;
  ru: string;
}

interface PropertyDetailHighlightsProps {
  propertyType?: string | null;
  viewLabels: ViewLabel[];
  instantBooking?: boolean;
  project?: {
    name_en?: string | null;
    name_ru?: string | null;
  } | null;
  floor?: number | string | null;
  unitNumber?: string | null;
}

export function PropertyDetailHighlights({
  propertyType,
  viewLabels,
  instantBooking,
  project,
  floor,
  unitNumber,
}: PropertyDetailHighlightsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const propertyTypeLabel =
    propertyType === 'villa'
      ? (isRu ? 'Вилла целиком' : 'Entire villa')
      : propertyType === 'condo'
        ? (isRu ? 'Апартаменты целиком' : 'Entire apartment')
        : (isRu ? 'Жильё целиком' : 'Entire place');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Home className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{propertyTypeLabel}</p>
        </div>
      </div>

      {viewLabels.length > 0 && (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {viewLabels.map((v) => (isRu ? v.ru : v.en)).join(' · ')}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Потрясающий вид из окон' : 'Amazing views from the windows'}
            </p>
          </div>
        </div>
      )}

      {instantBooking && (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {isRu ? 'Мгновенное бронирование' : 'Instant booking'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Бронируйте без ожидания подтверждения' : 'Book without waiting for approval'}
            </p>
          </div>
        </div>
      )}

      {project && (
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {isRu ? project.name_ru : project.name_en}
            </p>
            {(floor || unitNumber) && (
              <p className="text-sm text-muted-foreground">
                {floor && `${isRu ? 'Этаж' : 'Floor'} ${floor}`}
                {unitNumber && ` · ${unitNumber}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
