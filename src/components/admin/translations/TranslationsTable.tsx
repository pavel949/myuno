import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit2, Trash2, Sparkles, Check, X } from 'lucide-react';
import { Translation } from '@/hooks/useTranslationsAdmin';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { cn } from '@/lib/utils';

interface TranslationsTableProps {
  translations: Translation[];
  categories: string[];
  onUpdate: (id: string, updates: Partial<Translation>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function TranslationsTable({
  translations,
  categories,
  onUpdate,
  onDelete,
}: TranslationsTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Translation>>({});
  const { translate, isTranslating } = useAutoTranslate();

  const filteredTranslations = useMemo(() => {
    return translations.filter(t => {
      const matchesSearch = !search || 
        t.key.toLowerCase().includes(search.toLowerCase()) ||
        t.value_ru.toLowerCase().includes(search.toLowerCase()) ||
        t.value_en.toLowerCase().includes(search.toLowerCase()) ||
        (t.value_th && t.value_th.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [translations, search, categoryFilter]);

  const startEditing = (translation: Translation) => {
    setEditingId(translation.id);
    setEditValues({
      value_ru: translation.value_ru,
      value_en: translation.value_en,
      value_th: translation.value_th,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEditing = async () => {
    if (!editingId) return;
    const success = await onUpdate(editingId, editValues);
    if (success) {
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleAutoTranslate = async (sourceText: string, targetLang: 'ru' | 'en') => {
    const result = await translate(sourceText, targetLang);
    if (result.success) {
      setEditValues(prev => ({
        ...prev,
        [`value_${targetLang}`]: result.translated,
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить этот перевод?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ключу или тексту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Найдено: {filteredTranslations.length} из {translations.length}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Ключ</TableHead>
              <TableHead>RU</TableHead>
              <TableHead>EN</TableHead>
              <TableHead>TH</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTranslations.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">
                  <div className="space-y-1">
                    <span className="block truncate max-w-[180px]" title={t.key}>
                      {t.key}
                    </span>
                    {t.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {t.category}
                      </Badge>
                    )}
                    {t.is_custom && (
                      <Badge variant="outline" className="text-[10px] text-green-600">
                        изменён
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                {editingId === t.id ? (
                  <>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={editValues.value_ru || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, value_ru: e.target.value }))}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          disabled={isTranslating || !editValues.value_en}
                          onClick={() => handleAutoTranslate(editValues.value_en || '', 'ru')}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI из EN
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Input
                          value={editValues.value_en || ''}
                          onChange={(e) => setEditValues(prev => ({ ...prev, value_en: e.target.value }))}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs"
                          disabled={isTranslating || !editValues.value_ru}
                          onClick={() => handleAutoTranslate(editValues.value_ru || '', 'en')}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI из RU
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editValues.value_th || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, value_th: e.target.value }))}
                        className="text-sm"
                        placeholder="(опционально)"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEditing}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="text-sm max-w-[200px]">
                      <span className="line-clamp-2">{t.value_ru}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      <span className="line-clamp-2">{t.value_en}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">
                      <span className="line-clamp-2 text-muted-foreground">
                        {t.value_th || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => startEditing(t)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTranslations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Переводы не найдены
        </div>
      )}
    </div>
  );
}
