import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Bed, Bath, Sofa, UtensilsCrossed, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RoomBed {
  type: 'king' | 'queen' | 'double' | 'single' | 'sofa_bed' | 'bunk';
  count: number;
}

export interface Room {
  id: string;
  type: 'bedroom' | 'living' | 'kitchen' | 'bathroom' | 'outdoor';
  name: string;
  nameRu?: string;
  beds?: RoomBed[];
  amenities?: string[];
}

interface PropertyRoomsProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
  className?: string;
}

const roomTypes = [
  { value: 'bedroom', labelEn: 'Bedroom', labelRu: 'Спальня', icon: Bed },
  { value: 'living', labelEn: 'Living Room', labelRu: 'Гостиная', icon: Sofa },
  { value: 'kitchen', labelEn: 'Kitchen', labelRu: 'Кухня', icon: UtensilsCrossed },
  { value: 'bathroom', labelEn: 'Bathroom', labelRu: 'Ванная', icon: Bath },
  { value: 'outdoor', labelEn: 'Outdoor Space', labelRu: 'Терраса/Балкон', icon: TreePine },
];

const bedTypes = [
  { value: 'king', labelEn: 'King Bed', labelRu: 'Кровать King', sleeps: 2 },
  { value: 'queen', labelEn: 'Queen Bed', labelRu: 'Кровать Queen', sleeps: 2 },
  { value: 'double', labelEn: 'Double Bed', labelRu: 'Двуспальная', sleeps: 2 },
  { value: 'single', labelEn: 'Single Bed', labelRu: 'Односпальная', sleeps: 1 },
  { value: 'sofa_bed', labelEn: 'Sofa Bed', labelRu: 'Диван-кровать', sleeps: 2 },
  { value: 'bunk', labelEn: 'Bunk Bed', labelRu: 'Двухъярусная', sleeps: 2 },
];

const roomAmenities = [
  { value: 'tv', labelEn: 'TV', labelRu: 'Телевизор' },
  { value: 'ac', labelEn: 'Air Conditioning', labelRu: 'Кондиционер' },
  { value: 'ensuite', labelEn: 'En-suite Bathroom', labelRu: 'Своя ванная' },
  { value: 'balcony', labelEn: 'Balcony', labelRu: 'Балкон' },
  { value: 'wardrobe', labelEn: 'Wardrobe', labelRu: 'Шкаф' },
  { value: 'desk', labelEn: 'Work Desk', labelRu: 'Рабочий стол' },
  { value: 'safe', labelEn: 'Safe', labelRu: 'Сейф' },
  { value: 'minibar', labelEn: 'Mini Bar', labelRu: 'Мини-бар' },
];

export function PropertyRooms({ rooms, onChange, className }: PropertyRoomsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const addRoom = () => {
    const newRoom: Room = {
      id: crypto.randomUUID(),
      type: 'bedroom',
      name: isRu ? `Спальня ${rooms.filter(r => r.type === 'bedroom').length + 1}` : `Bedroom ${rooms.filter(r => r.type === 'bedroom').length + 1}`,
      beds: [],
      amenities: [],
    };
    onChange([...rooms, newRoom]);
  };

  const removeRoom = (roomId: string) => {
    onChange(rooms.filter(r => r.id !== roomId));
  };

  const updateRoom = (roomId: string, updates: Partial<Room>) => {
    onChange(rooms.map(r => r.id === roomId ? { ...r, ...updates } : r));
  };

  const addBed = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const newBed: RoomBed = { type: 'double', count: 1 };
    updateRoom(roomId, { beds: [...(room.beds || []), newBed] });
  };

  const updateBed = (roomId: string, bedIndex: number, updates: Partial<RoomBed>) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room?.beds) return;
    
    const newBeds = [...room.beds];
    newBeds[bedIndex] = { ...newBeds[bedIndex], ...updates };
    updateRoom(roomId, { beds: newBeds });
  };

  const removeBed = (roomId: string, bedIndex: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room?.beds) return;
    
    updateRoom(roomId, { beds: room.beds.filter((_, i) => i !== bedIndex) });
  };

  const toggleAmenity = (roomId: string, amenity: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const amenities = room.amenities || [];
    const newAmenities = amenities.includes(amenity)
      ? amenities.filter(a => a !== amenity)
      : [...amenities, amenity];
    updateRoom(roomId, { amenities: newAmenities });
  };

  const calculateTotalSleeps = () => {
    return rooms.reduce((total, room) => {
      const roomSleeps = (room.beds || []).reduce((bedTotal, bed) => {
        const bedType = bedTypes.find(bt => bt.value === bed.type);
        return bedTotal + (bedType?.sleeps || 0) * bed.count;
      }, 0);
      return total + roomSleeps;
    }, 0);
  };

  const getRoomIcon = (type: string) => {
    const roomType = roomTypes.find(rt => rt.value === type);
    return roomType?.icon || Bed;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">
            {isRu ? 'Комнаты и спальные места' : 'Rooms & Sleeping Arrangements'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? `Всего спальных мест: ${calculateTotalSleeps()}` : `Total sleeping capacity: ${calculateTotalSleeps()}`}
          </p>
        </div>
        <Button onClick={addRoom} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add Room'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Bed className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{isRu ? 'Нет добавленных комнат' : 'No rooms added yet'}</p>
            <Button onClick={addRoom} variant="link" className="mt-2">
              {isRu ? 'Добавить первую комнату' : 'Add your first room'}
            </Button>
          </div>
        ) : (
          rooms.map((room) => {
            const RoomIcon = getRoomIcon(room.type);
            return (
              <div key={room.id} className="border rounded-lg p-4 space-y-4">
                {/* Room Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <RoomIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Тип' : 'Type'}
                      </Label>
                      <Select
                        value={room.type}
                        onValueChange={(value) => updateRoom(room.id, { type: value as Room['type'] })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map(rt => (
                            <SelectItem key={rt.value} value={rt.value}>
                              {isRu ? rt.labelRu : rt.labelEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Название (EN)' : 'Name (EN)'}
                      </Label>
                      <Input
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                        placeholder="Master Bedroom"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {isRu ? 'Название (RU)' : 'Name (RU)'}
                      </Label>
                      <Input
                        value={room.nameRu || ''}
                        onChange={(e) => updateRoom(room.id, { nameRu: e.target.value })}
                        placeholder="Главная спальня"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoom(room.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Beds Section - Only for bedrooms and living rooms */}
                {(room.type === 'bedroom' || room.type === 'living') && (
                  <div className="pl-4 border-l-2 border-muted space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {isRu ? 'Кровати' : 'Beds'}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addBed(room.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {isRu ? 'Добавить кровать' : 'Add Bed'}
                      </Button>
                    </div>
                    
                    {(room.beds || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'Нет кроватей' : 'No beds added'}
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {(room.beds || []).map((bed, bedIndex) => (
                          <div key={bedIndex} className="flex items-center gap-2">
                            <Select
                              value={bed.type}
                              onValueChange={(value) => updateBed(room.id, bedIndex, { type: value as RoomBed['type'] })}
                            >
                              <SelectTrigger className="h-8 flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bedTypes.map(bt => (
                                  <SelectItem key={bt.value} value={bt.value}>
                                    {isRu ? bt.labelRu : bt.labelEn} ({bt.sleeps} {isRu ? 'чел.' : 'pax'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                              <Label className="text-xs whitespace-nowrap">×</Label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                value={bed.count}
                                onChange={(e) => updateBed(room.id, bedIndex, { count: parseInt(e.target.value) || 1 })}
                                className="h-8 w-16 text-center"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeBed(room.id, bedIndex)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Room Amenities */}
                <div className="pl-4 border-l-2 border-muted">
                  <Label className="text-sm font-medium mb-2 block">
                    {isRu ? 'Удобства в комнате' : 'Room Amenities'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {roomAmenities.map(amenity => (
                      <Badge
                        key={amenity.value}
                        variant={(room.amenities || []).includes(amenity.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleAmenity(room.id, amenity.value)}
                      >
                        {isRu ? amenity.labelRu : amenity.labelEn}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
