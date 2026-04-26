/**
 * AdminVerticalCRUD — Generic CRUD page for admin vertical management.
 * Replaces 10+ nearly-identical admin pages with a single configurable component.
 *
 * Each vertical provides a FieldDef[] config; this component handles:
 * - List rendering (card-based with cover image)
 * - Create/Edit dialog with dynamic form
 * - Delete confirmation
 * - Provider selector
 * - Bilingual labels
 */
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { toast } from 'sonner';
import { Plus, MoreVertical, Edit, Trash2, Loader2, MapPin, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Field schema types ───

export interface SelectOption {
  value: string;
  label: string;
  labelRu: string;
}

export interface FieldDef {
  /** DB column key */
  key: string;
  /** Field type */
  type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'image' | 'multi-image' | 'comma-list';
  labelEn: string;
  labelRu: string;
  required?: boolean;
  /** Grid column span (out of 12). Default: 6 (half width). Use 12 for full. */
  colSpan?: number;
  /** For 'select' type */
  options?: SelectOption[];
  placeholder?: string;
  /** Default value */
  defaultValue?: unknown;
}

export interface AdminVerticalConfig {
  /** Page title */
  titleEn: string;
  titleRu: string;
  /** Icon component for empty state */
  icon?: LucideIcon;
  /** Form field definitions */
  fields: FieldDef[];
  /** Which field to show as subtitle in list cards (e.g. 'district') */
  subtitleField?: string;
  /** Which field to show as price in list cards */
  priceField?: string;
  /** Which field holds the type/category badge */
  typeField?: string;
  /** Type options for badge display */
  typeOptions?: SelectOption[];
}

// Permissive shapes — consumer hooks (useAdminContent) return Record<string, any>.
// Keep both items and form data permissive to maintain back-compat.
export type AdminVerticalItem = Record<string, any>;
export type AdminVerticalFormData = Record<string, any>;

interface AdminVerticalCRUDProps {
  config: AdminVerticalConfig;
  /** The admin hook result */
  hook: {
    items: AdminVerticalItem[];
    isLoading: boolean;
    createItem: (data: AdminVerticalFormData) => Promise<unknown>;
    updateItem: (data: AdminVerticalFormData & { id: string }) => Promise<unknown>;
    deleteItem: (id: string) => Promise<unknown>;
  };
}

function buildDefaultFormData(fields: FieldDef[]): Record<string, any> {
  const data: Record<string, any> = { provider_id: '' };
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      data[f.key] = f.defaultValue;
    } else {
      switch (f.type) {
        case 'text': case 'textarea': case 'select': case 'image':
          data[f.key] = ''; break;
        case 'number':
          data[f.key] = ''; break;
        case 'switch':
          data[f.key] = f.key === 'is_active' ? true : false; break;
        case 'multi-image': case 'comma-list':
          data[f.key] = f.type === 'comma-list' ? '' : []; break;
      }
    }
  }
  return data;
}

function itemToFormData(item: any, fields: FieldDef[]): Record<string, any> {
  const data: Record<string, any> = { provider_id: item.provider_id || '' };
  for (const f of fields) {
    const val = item[f.key];
    switch (f.type) {
      case 'number':
        data[f.key] = val != null ? String(val) : '';
        break;
      case 'comma-list':
        data[f.key] = Array.isArray(val) ? val.join(', ') : (val || '');
        break;
      case 'multi-image':
        data[f.key] = val || [];
        break;
      case 'switch':
        data[f.key] = val ?? (f.key === 'is_active' ? true : false);
        break;
      default:
        data[f.key] = val ?? '';
    }
  }
  return data;
}

function formDataToPayload(formData: Record<string, any>, fields: FieldDef[]): Record<string, any> {
  const payload: Record<string, any> = { provider_id: formData.provider_id };
  for (const f of fields) {
    const val = formData[f.key];
    switch (f.type) {
      case 'number':
        payload[f.key] = val ? parseFloat(val) : null;
        break;
      case 'comma-list':
        payload[f.key] = typeof val === 'string'
          ? val.split(',').map((s: string) => s.trim()).filter(Boolean)
          : val || [];
        break;
      case 'text': case 'textarea': case 'image':
        payload[f.key] = val || null;
        break;
      default:
        payload[f.key] = val;
    }
  }
  // Ensure name_ru fallback
  if (!payload.name_ru && payload.name_en) payload.name_ru = payload.name_en;
  return payload;
}

export function AdminVerticalCRUD({ config, hook }: AdminVerticalCRUDProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { items, isLoading, createItem, updateItem, deleteItem } = hook;
  const Icon = config.icon || Package;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(() => buildDefaultFormData(config.fields));

  const resetForm = useCallback(() => {
    setFormData(buildDefaultFormData(config.fields));
    setEditingItem(null);
  }, [config.fields]);

  const openCreate = () => { resetForm(); setIsDialogOpen(true); };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData(itemToFormData(item, config.fields));
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en) {
      toast.error(isRu ? 'Заполните название' : 'Fill in name');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = formDataToPayload(formData, config.fields);
      if (editingItem) {
        await updateItem({ id: editingItem.id, ...payload });
        toast.success(isRu ? 'Обновлено' : 'Updated');
      } else {
        await createItem(payload);
        toast.success(isRu ? 'Создано' : 'Created');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
      toast.success(isRu ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ─── Render field ───
  const renderField = (f: FieldDef) => {
    const label = isRu ? f.labelRu : f.labelEn;
    switch (f.type) {
      case 'text':
        return (
          <div key={f.key}>
            <Label>{label}{f.required && ' *'}</Label>
            <Input value={formData[f.key] || ''} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
          </div>
        );
      case 'textarea':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <Textarea value={formData[f.key] || ''} onChange={e => updateField(f.key, e.target.value)} />
          </div>
        );
      case 'number':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <Input type="number" value={formData[f.key] || ''} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder} />
          </div>
        );
      case 'select':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <Select value={formData[f.key] || ''} onValueChange={v => updateField(f.key, v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {f.options?.map(o => (
                  <SelectItem key={o.value} value={o.value}>{isRu ? o.labelRu : o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'switch':
        return (
          <div key={f.key} className="flex items-center gap-2">
            <Switch checked={!!formData[f.key]} onCheckedChange={v => updateField(f.key, v)} />
            <Label>{label}</Label>
          </div>
        );
      case 'image':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <ImageUpload value={formData[f.key] || ''} onChange={v => updateField(f.key, v)} />
          </div>
        );
      case 'multi-image':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <MultiImageUpload value={formData[f.key] || []} onChange={v => updateField(f.key, v)} maxImages={10} />
          </div>
        );
      case 'comma-list':
        return (
          <div key={f.key}>
            <Label>{label}</Label>
            <Input value={formData[f.key] || ''} onChange={e => updateField(f.key, e.target.value)} placeholder={f.placeholder || 'item1, item2, ...'} />
          </div>
        );
      default:
        return null;
    }
  };

  // Group fields into rows based on colSpan
  const renderFormFields = () => {
    const rows: FieldDef[][] = [];
    let currentRow: FieldDef[] = [];
    let currentSpan = 0;

    for (const f of config.fields) {
      const span = f.colSpan || 6;
      if (currentSpan + span > 12 && currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
      currentRow.push(f);
      currentSpan += span;
      if (currentSpan >= 12) {
        rows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    return rows.map((row, i) => {
      if (row.length === 1 && (row[0].colSpan || 6) >= 12) {
        return <div key={i}>{renderField(row[0])}</div>;
      }
      return (
        <div key={i} className="grid grid-cols-2 gap-4">
          {row.map(f => renderField(f))}
        </div>
      );
    });
  };

  // ─── Get badge text for an item ───
  const getTypeBadge = (item: any) => {
    if (!config.typeField || !config.typeOptions) return null;
    const val = item[config.typeField];
    const opt = config.typeOptions.find(o => o.value === val);
    return opt ? (isRu ? opt.labelRu : opt.label) : val;
  };

  return (
    <PageContainer>
      <PageHeader title={isRu ? config.titleRu : config.titleEn} showBack />
      <Button className="w-full mb-4" onClick={openCreate}>
        <Plus className="h-4 w-4 mr-2" />
        {isRu ? 'Добавить' : 'Add'}
      </Button>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt="" className="w-20 h-20 rounded-none object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-none bg-muted flex items-center justify-center">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">
                          {isRu ? (item.name_ru || item.name_en) : item.name_en}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                          {getTypeBadge(item) && <Badge variant="secondary">{getTypeBadge(item)}</Badge>}
                          <Badge variant={item.is_active !== false ? 'default' : 'secondary'}>
                            {item.is_active !== false ? (isRu ? 'Активно' : 'Active') : (isRu ? 'Неактивно' : 'Inactive')}
                          </Badge>
                          {item[config.subtitleField || 'district'] && (
                            <span className="truncate"><MapPin className="h-3 w-3 inline" /> {item[config.subtitleField || 'district']}</span>
                          )}
                        </div>
                        {config.priceField && item[config.priceField] != null && (
                          <p className="text-sm mt-1 text-primary font-medium">
                            ฿{Number(item[config.priceField]).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />{isRu ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}>
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
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {editingItem
                ? (isRu ? 'Редактировать' : 'Edit')
                : (isRu ? 'Добавить' : 'Add')}
            </DialogTitle>
            <DialogDescription>{isRu ? 'Заполните данные' : 'Fill in details'}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-4 py-4">
              <ProviderSelector
                value={formData.provider_id || ''}
                onChange={v => updateField('provider_id', v)}
              />
              {renderFormFields()}
            </div>
          </ScrollArea>
          <div className="p-6 pt-0 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? (isRu ? 'Обновить' : 'Update') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Удалить?' : 'Delete?'}</DialogTitle>
            <DialogDescription>{isRu ? 'Действие нельзя отменить' : 'Cannot undo'}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              {isRu ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
