import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Predefined attribute keys with translations
const PREDEFINED_ATTRIBUTE_KEYS = [
  { key: 'brand', labelEn: 'Brand', labelRu: 'Бренд' },
  { key: 'origin', labelEn: 'Country of Origin', labelRu: 'Страна производства' },
  { key: 'organic', labelEn: 'Organic', labelRu: 'Органический' },
  { key: 'material', labelEn: 'Material', labelRu: 'Материал' },
  { key: 'color', labelEn: 'Color', labelRu: 'Цвет' },
  { key: 'size', labelEn: 'Size', labelRu: 'Размер' },
  { key: 'storage', labelEn: 'Storage Conditions', labelRu: 'Условия хранения' },
  { key: 'expiry', labelEn: 'Shelf Life', labelRu: 'Срок годности' },
  { key: 'warranty', labelEn: 'Warranty', labelRu: 'Гарантия' },
  { key: 'weight', labelEn: 'Weight', labelRu: 'Вес' },
  { key: 'dimensions', labelEn: 'Dimensions', labelRu: 'Размеры' },
  { key: 'custom', labelEn: 'Custom...', labelRu: 'Другое...' },
];

export interface ProductAttribute {
  id?: string;
  attribute_key: string;
  attribute_value: string;
  attribute_value_ru: string;
  sort_order: number;
}

interface AttributeEditorProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
  className?: string;
  maxAttributes?: number;
}

export function AttributeEditor({
  attributes,
  onChange,
  className,
  maxAttributes = 10,
}: AttributeEditorProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [customKeyInput, setCustomKeyInput] = useState('');

  const addAttribute = () => {
    if (attributes.length >= maxAttributes) return;
    
    onChange([
      ...attributes,
      {
        attribute_key: '',
        attribute_value: '',
        attribute_value_ru: '',
        sort_order: attributes.length,
      },
    ]);
  };

  const updateAttribute = (index: number, field: keyof ProductAttribute, value: string | number) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeAttribute = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index);
    // Re-order remaining attributes
    onChange(updated.map((attr, i) => ({ ...attr, sort_order: i })));
  };

  const getKeyLabel = (key: string) => {
    const predefined = PREDEFINED_ATTRIBUTE_KEYS.find(k => k.key === key);
    return predefined ? (isRussian ? predefined.labelRu : predefined.labelEn) : key;
  };

  const usedKeys = attributes.map(a => a.attribute_key);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {isRussian ? 'Атрибуты товара' : 'Product Attributes'}
        </Label>
        <span className="text-xs text-muted-foreground">
          {attributes.length}/{maxAttributes}
        </span>
      </div>

      {attributes.length === 0 ? (
        <div className="text-center py-4 border border-dashed rounded-none bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">
            {isRussian 
              ? 'Добавьте характеристики товара' 
              : 'Add product attributes'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRussian
              ? 'Бренд, страна, материал и др.'
              : 'Brand, country, material, etc.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attributes.map((attr, index) => (
            <div 
              key={index} 
              className="flex items-start gap-2 p-2 border rounded-none bg-card"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0 cursor-grab" />
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Attribute Key */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {isRussian ? 'Атрибут' : 'Attribute'}
                  </Label>
                  <Select
                    value={attr.attribute_key}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        // Show custom input
                        updateAttribute(index, 'attribute_key', '');
                      } else {
                        updateAttribute(index, 'attribute_key', value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={isRussian ? 'Выбрать...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_ATTRIBUTE_KEYS
                        .filter(k => k.key === 'custom' || !usedKeys.includes(k.key) || k.key === attr.attribute_key)
                        .map((k) => (
                          <SelectItem key={k.key} value={k.key}>
                            {isRussian ? k.labelRu : k.labelEn}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {/* Custom key input */}
                  {attr.attribute_key === '' && (
                    <Input
                      value={customKeyInput}
                      onChange={(e) => {
                        setCustomKeyInput(e.target.value);
                        updateAttribute(index, 'attribute_key', e.target.value);
                      }}
                      placeholder={isRussian ? 'Введите название' : 'Enter name'}
                      className="mt-1 h-8"
                    />
                  )}
                </div>

                {/* Value EN */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {isRussian ? 'Значение (EN)' : 'Value (EN)'}
                  </Label>
                  <Input
                    value={attr.attribute_value}
                    onChange={(e) => updateAttribute(index, 'attribute_value', e.target.value)}
                    placeholder="Value in English"
                    className="h-9"
                  />
                </div>

                {/* Value RU */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {isRussian ? 'Значение (RU)' : 'Value (RU)'}
                  </Label>
                  <Input
                    value={attr.attribute_value_ru}
                    onChange={(e) => updateAttribute(index, 'attribute_value_ru', e.target.value)}
                    placeholder="Значение на русском"
                    className="h-9"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-5"
                onClick={() => removeAttribute(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {attributes.length < maxAttributes && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAttribute}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isRussian ? 'Добавить атрибут' : 'Add Attribute'}
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        {isRussian
          ? 'Атрибуты помогают покупателям находить и сравнивать товары'
          : 'Attributes help buyers find and compare products'}
      </p>
    </div>
  );
}
