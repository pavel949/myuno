import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxonomy, TaxonomyOption } from '@/hooks/useTaxonomy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2, 
  Loader2,
  Search,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  typeKey: string;
}

interface EditingValue {
  id?: string;
  value_key: string;
  value_en: string;
  value_ru: string;
  icon: string;
  is_active: boolean;
}

const EMPTY_VALUE: EditingValue = {
  value_key: '',
  value_en: '',
  value_ru: '',
  icon: '',
  is_active: true,
};

function SortableRow({ 
  option, 
  onEdit, 
  onDelete,
  language 
}: { 
  option: TaxonomyOption; 
  onEdit: () => void;
  onDelete: () => void;
  language: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell>
        <span className="text-lg">{option.icon || '📋'}</span>
      </TableCell>
      <TableCell className="font-mono text-sm">{option.value}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{option.labelEn}</p>
          <p className="text-sm text-muted-foreground">{option.labelRu}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {language === 'ru' ? 'Активен' : 'Active'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function TaxonomyValueEditor({ typeKey }: Props) {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  
  const { 
    options, 
    isLoading, 
    create, 
    update, 
    delete: deleteValue,
    bulkUpdate,
    isCreating,
    isUpdating,
    isDeleting 
  } = useTaxonomy(typeKey, { includeInactive: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<EditingValue>(EMPTY_VALUE);
  const [isNew, setIsNew] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredOptions = options.filter(opt =>
    opt.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.labelRu.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(o => o.id === active.id);
      const newIndex = options.findIndex(o => o.id === over.id);
      const newOrder = arrayMove(options, oldIndex, newIndex);
      
      try {
        await bulkUpdate(
          newOrder.map((opt, idx) => ({
            id: opt.id,
            sort_order: idx + 1,
          }))
        );
        toast.success(t('Order updated', 'Порядок обновлён'));
      } catch (error) {
        toast.error(t('Failed to update order', 'Не удалось обновить порядок'));
      }
    }
  };

  const handleOpenNew = () => {
    setEditingValue(EMPTY_VALUE);
    setIsNew(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (option: TaxonomyOption) => {
    setEditingValue({
      id: option.id,
      value_key: option.value,
      value_en: option.labelEn,
      value_ru: option.labelRu,
      icon: option.icon || '',
      is_active: true,
    });
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingValue.value_key || !editingValue.value_en) {
      toast.error(t('Key and English label are required', 'Ключ и английское название обязательны'));
      return;
    }

    try {
      if (isNew) {
        await create({
          value_key: editingValue.value_key,
          value_en: editingValue.value_en,
          value_ru: editingValue.value_ru || null,
          icon: editingValue.icon || null,
          color: null,
          parent_id: null,
          sort_order: options.length + 1,
          is_active: editingValue.is_active,
          metadata: {},
        });
        toast.success(t('Value created', 'Значение создано'));
      } else {
        await update({
          id: editingValue.id!,
          value_key: editingValue.value_key,
          value_en: editingValue.value_en,
          value_ru: editingValue.value_ru || null,
          icon: editingValue.icon || null,
          is_active: editingValue.is_active,
        });
        toast.success(t('Value updated', 'Значение обновлено'));
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(t('Failed to save', 'Не удалось сохранить'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('Are you sure you want to delete this value?', 'Удалить это значение?'))) {
      return;
    }

    try {
      await deleteValue(id);
      toast.success(t('Value deleted', 'Значение удалено'));
    } catch (error) {
      toast.error(t('Failed to delete', 'Не удалось удалить'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search values...', 'Поиск значений...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Value', 'Добавить')}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">{t('Icon', 'Иконка')}</TableHead>
                <TableHead className="w-32">{t('Key', 'Ключ')}</TableHead>
                <TableHead>{t('Labels', 'Названия')}</TableHead>
                <TableHead className="w-24">{t('Status', 'Статус')}</TableHead>
                <TableHead className="w-24 text-right">{t('Actions', 'Действия')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={filteredOptions.map(o => o.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredOptions.map((option) => (
                  <SortableRow
                    key={option.id}
                    option={option}
                    onEdit={() => handleOpenEdit(option)}
                    onDelete={() => handleDelete(option.id)}
                    language={language}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>

        {filteredOptions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery 
              ? t('No values match your search', 'Ничего не найдено')
              : t('No values yet. Add the first one!', 'Пока нет значений. Добавьте первое!')}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNew 
                ? t('Add New Value', 'Добавить значение')
                : t('Edit Value', 'Редактировать значение')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Key (ID)', 'Ключ (ID)')}</Label>
                <Input
                  value={editingValue.value_key}
                  onChange={(e) => setEditingValue({ ...editingValue, value_key: e.target.value })}
                  placeholder="e.g. villa, patong"
                  disabled={!isNew}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Icon', 'Иконка')}</Label>
                <Input
                  value={editingValue.icon}
                  onChange={(e) => setEditingValue({ ...editingValue, icon: e.target.value })}
                  placeholder="🏠"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('English Label', 'Название (EN)')}</Label>
              <Input
                value={editingValue.value_en}
                onChange={(e) => setEditingValue({ ...editingValue, value_en: e.target.value })}
                placeholder="Villa"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('Russian Label', 'Название (RU)')}</Label>
              <Input
                value={editingValue.value_ru}
                onChange={(e) => setEditingValue({ ...editingValue, value_ru: e.target.value })}
                placeholder="Вилла"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('Active', 'Активен')}</Label>
              <Switch
                checked={editingValue.is_active}
                onCheckedChange={(checked) => setEditingValue({ ...editingValue, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('Cancel', 'Отмена')}
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {t('Save', 'Сохранить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
