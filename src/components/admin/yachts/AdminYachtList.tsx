import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Yacht } from '@/hooks/useYachts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sailboat, MoreVertical, Edit, Trash2, Users, Ruler, Bed } from 'lucide-react';

const yachtTypes = [
  { value: 'motor_yacht', label: 'Motor Yacht', labelRu: 'Моторная яхта' },
  { value: 'catamaran', label: 'Catamaran', labelRu: 'Катамаран' },
  { value: 'speedboat', label: 'Speedboat', labelRu: 'Скоростная лодка' },
  { value: 'superyacht', label: 'Superyacht', labelRu: 'Суперяхта' },
];

interface AdminYachtListProps {
  yachts: Yacht[];
  isLoading: boolean;
  onEdit: (yacht: Yacht) => void;
  onDelete: (id: string) => void;
}

export function AdminYachtList({ yachts, isLoading, onEdit, onDelete }: AdminYachtListProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  if (yachts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sailboat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-1">{isRu ? 'Нет яхт' : 'No yachts'}</h3>
          <p className="text-sm text-muted-foreground">{isRu ? 'Добавьте яхту или катамаран' : 'Add a yacht or catamaran'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {yachts.map((yacht) => (
        <Card key={yacht.id} className={!yacht.is_verified ? 'border-amber-500/50' : ''}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              {yacht.cover_image ? (
                <img src={yacht.cover_image} alt={yacht.name_en} className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                  <Sailboat className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium">{isRu ? yacht.name_ru : yacht.name_en}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {yachtTypes.find(t => t.value === yacht.yacht_type)?.[isRu ? 'labelRu' : 'label']}
                      </Badge>
                      {!yacht.is_verified && (
                        <Badge variant="outline" className="text-xs text-amber-600">{isRu ? 'На модерации' : 'Pending'}</Badge>
                      )}
                      {yacht.is_featured && (
                        <Badge className="text-xs bg-primary">{isRu ? 'Избранное' : 'Featured'}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-1">
                      <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" />{yacht.capacity}</span>
                      {yacht.length_meters && <span className="flex items-center gap-1 text-muted-foreground"><Ruler className="h-3 w-3" />{yacht.length_meters}m</span>}
                      {yacht.cabins && <span className="flex items-center gap-1 text-muted-foreground"><Bed className="h-3 w-3" />{yacht.cabins}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {yacht.price_half_day && (
                        <span>
                          <span className="text-muted-foreground">{isRu ? 'Полдня:' : 'Half:'}</span>{' '}
                          <span className="font-bold text-primary">฿{yacht.price_half_day.toLocaleString()}</span>
                        </span>
                      )}
                      <span>
                        <span className="text-muted-foreground">{isRu ? 'День:' : 'Day:'}</span>{' '}
                        <span className="font-bold text-primary">฿{yacht.price_full_day?.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(yacht)}>
                        <Edit className="h-4 w-4 mr-2" />{isRu ? 'Редактировать' : 'Edit'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => onDelete(yacht.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />{isRu ? 'Удалить' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
