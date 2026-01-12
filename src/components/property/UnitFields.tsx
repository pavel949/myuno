import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Eye, Sofa } from 'lucide-react';

interface UnitFieldsProps {
  floor?: number;
  unitNumber?: string;
  viewType?: string;
  furnishingLevel?: string;
  equipment?: string[];
  onFloorChange: (floor: number | undefined) => void;
  onUnitNumberChange: (unitNumber: string) => void;
  onViewTypeChange: (viewType: string) => void;
  onFurnishingLevelChange: (level: string) => void;
  onEquipmentChange: (equipment: string[]) => void;
}

const viewTypes = [
  { id: 'sea', labelEn: 'Sea View', labelRu: 'Вид на море' },
  { id: 'pool', labelEn: 'Pool View', labelRu: 'Вид на бассейн' },
  { id: 'garden', labelEn: 'Garden View', labelRu: 'Вид на сад' },
  { id: 'mountain', labelEn: 'Mountain View', labelRu: 'Вид на горы' },
  { id: 'city', labelEn: 'City View', labelRu: 'Вид на город' },
  { id: 'parking', labelEn: 'Parking View', labelRu: 'Вид на парковку' },
  { id: 'interior', labelEn: 'Interior View', labelRu: 'Внутренний вид' },
];

const furnishingLevels = [
  { id: 'unfurnished', labelEn: 'Unfurnished', labelRu: 'Без мебели' },
  { id: 'partially', labelEn: 'Partially Furnished', labelRu: 'Частичная меблировка' },
  { id: 'fully', labelEn: 'Fully Furnished', labelRu: 'Полная меблировка' },
  { id: 'luxury', labelEn: 'Luxury Furnished', labelRu: 'Люкс меблировка' },
];

const equipmentList = [
  { id: 'tv', labelEn: 'TV', labelRu: 'Телевизор' },
  { id: 'washer', labelEn: 'Washing Machine', labelRu: 'Стиральная машина' },
  { id: 'dryer', labelEn: 'Dryer', labelRu: 'Сушильная машина' },
  { id: 'dishwasher', labelEn: 'Dishwasher', labelRu: 'Посудомоечная машина' },
  { id: 'fridge', labelEn: 'Refrigerator', labelRu: 'Холодильник' },
  { id: 'microwave', labelEn: 'Microwave', labelRu: 'Микроволновка' },
  { id: 'oven', labelEn: 'Oven', labelRu: 'Духовка' },
  { id: 'coffee_machine', labelEn: 'Coffee Machine', labelRu: 'Кофемашина' },
  { id: 'iron', labelEn: 'Iron', labelRu: 'Утюг' },
  { id: 'hair_dryer', labelEn: 'Hair Dryer', labelRu: 'Фен' },
  { id: 'safe', labelEn: 'Safe', labelRu: 'Сейф' },
  { id: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер' },
];

export function UnitFields({
  floor,
  unitNumber,
  viewType,
  furnishingLevel,
  equipment = [],
  onFloorChange,
  onUnitNumberChange,
  onViewTypeChange,
  onFurnishingLevelChange,
  onEquipmentChange,
}: UnitFieldsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleEquipmentToggle = (equipmentId: string) => {
    if (equipment.includes(equipmentId)) {
      onEquipmentChange(equipment.filter(e => e !== equipmentId));
    } else {
      onEquipmentChange([...equipment, equipmentId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="h-4 w-4" />
          {isRu ? 'Характеристики юнита' : 'Unit Details'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Floor and Unit Number */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{isRu ? 'Этаж' : 'Floor'}</Label>
            <Input
              type="number"
              min={-2}
              max={100}
              value={floor ?? ''}
              onChange={(e) => onFloorChange(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="5"
            />
          </div>
          <div className="space-y-2">
            <Label>{isRu ? 'Номер квартиры' : 'Unit Number'}</Label>
            <Input
              value={unitNumber ?? ''}
              onChange={(e) => onUnitNumberChange(e.target.value)}
              placeholder="A-501"
            />
          </div>
        </div>

        {/* View Type */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {isRu ? 'Вид из окна' : 'View Type'}
          </Label>
          <Select value={viewType || ''} onValueChange={onViewTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {viewTypes.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {isRu ? view.labelRu : view.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Furnishing Level */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Sofa className="h-4 w-4" />
            {isRu ? 'Уровень меблировки' : 'Furnishing Level'}
          </Label>
          <Select value={furnishingLevel || ''} onValueChange={onFurnishingLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {furnishingLevels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {isRu ? level.labelRu : level.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equipment */}
        <div className="space-y-2">
          <Label>{isRu ? 'Оборудование и техника' : 'Equipment'}</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg bg-muted/30">
            {equipmentList.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`equipment-${item.id}`}
                  checked={equipment.includes(item.id)}
                  onCheckedChange={() => handleEquipmentToggle(item.id)}
                />
                <label
                  htmlFor={`equipment-${item.id}`}
                  className="text-sm cursor-pointer"
                >
                  {isRu ? item.labelRu : item.labelEn}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
