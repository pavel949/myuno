import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Heart,
  MapPin,
  Utensils,
  Home,
  Compass
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Collection {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const defaultCollections: Collection[] = [
  { id: 'all', name: 'Все избранное', icon: 'heart', color: 'from-red-500 to-pink-500', count: 0 },
  { id: 'places', name: 'Места', icon: 'map-pin', color: 'from-blue-500 to-cyan-500', count: 0 },
  { id: 'food', name: 'Еда', icon: 'utensils', color: 'from-orange-500 to-amber-500', count: 0 },
  { id: 'stay', name: 'Жильё', icon: 'home', color: 'from-emerald-500 to-green-500', count: 0 },
  { id: 'activities', name: 'Активности', icon: 'compass', color: 'from-purple-500 to-violet-500', count: 0 },
];

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  'map-pin': MapPin,
  utensils: Utensils,
  home: Home,
  compass: Compass,
  folder: Folder,
};

interface FavoriteCollectionsProps {
  favorites: any[];
  onSelectCollection: (id: string) => void;
  selectedCollection: string;
}

export function FavoriteCollections({ 
  favorites, 
  onSelectCollection, 
  selectedCollection 
}: FavoriteCollectionsProps) {
  const { language } = useLanguage();
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('myuno-favorite-collections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultCollections;
      }
    }
    return defaultCollections;
  });
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const saveCollections = (newCollections: Collection[]) => {
    setCollections(newCollections);
    localStorage.setItem('myuno-favorite-collections', JSON.stringify(newCollections));
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const newCollection: Collection = {
      id: `custom-${Date.now()}`,
      name: newCollectionName,
      icon: 'folder',
      color: 'from-slate-500 to-zinc-500',
      count: 0,
    };
    
    saveCollections([...collections, newCollection]);
    setNewCollectionName('');
    setIsCreateOpen(false);
    toast.success(language === 'ru' ? 'Коллекция создана' : 'Collection created');
  };

  const handleDeleteCollection = (id: string) => {
    if (id === 'all') return;
    saveCollections(collections.filter(c => c.id !== id));
    if (selectedCollection === id) {
      onSelectCollection('all');
    }
    toast.success(language === 'ru' ? 'Коллекция удалена' : 'Collection deleted');
  };

  const handleRenameCollection = () => {
    if (!editingCollection || !newCollectionName.trim()) return;
    
    saveCollections(collections.map(c => 
      c.id === editingCollection.id 
        ? { ...c, name: newCollectionName }
        : c
    ));
    setEditingCollection(null);
    setNewCollectionName('');
    toast.success(language === 'ru' ? 'Коллекция переименована' : 'Collection renamed');
  };

  // Calculate counts
  const collectionsWithCounts = collections.map(c => ({
    ...c,
    count: c.id === 'all' ? favorites.length : 0, // TODO: implement proper counting per collection
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Коллекции' : 'Collections'}
        </h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Plus className="w-4 h-4" />
              {language === 'ru' ? 'Новая' : 'New'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ru' ? 'Новая коллекция' : 'New Collection'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder={language === 'ru' ? 'Название коллекции' : 'Collection name'}
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
              <Button onClick={handleCreateCollection} className="w-full">
                {language === 'ru' ? 'Создать' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Collection Dialog */}
      <Dialog open={!!editingCollection} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Переименовать коллекцию' : 'Rename Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder={language === 'ru' ? 'Новое название' : 'New name'}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameCollection()}
            />
            <Button onClick={handleRenameCollection} className="w-full">
              {language === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collections Grid */}
      <div className="grid grid-cols-2 gap-2">
        {collectionsWithCounts.map((collection) => {
          const Icon = iconMap[collection.icon] || Folder;
          const isSelected = selectedCollection === collection.id;
          const isCustom = collection.id.startsWith('custom-');
          
          return (
            <div
              key={collection.id}
              className={cn(
                "relative flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                isSelected 
                  ? "bg-primary/10 border-primary" 
                  : "bg-card hover:bg-muted/50"
              )}
              onClick={() => onSelectCollection(collection.id)}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                collection.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{collection.name}</p>
                <p className="text-xs text-muted-foreground">
                  {collection.count} {language === 'ru' ? 'элем.' : 'items'}
                </p>
              </div>
              
              {isCustom && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 absolute top-1 right-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingCollection(collection);
                      setNewCollectionName(collection.name);
                    }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Переименовать' : 'Rename'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteCollection(collection.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {language === 'ru' ? 'Удалить' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
