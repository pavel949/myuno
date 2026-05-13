/**
 * Odoo-style configurable tag picker for CRM contacts.
 * Allows selecting existing tags, creating new ones inline, and managing colors.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Plus, Tag, Settings2, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContactTags, useCreateContactTag, useDeleteContactTag, ContactTag, TAG_COLOR_PALETTE } from '@/hooks/useContactTags';

import { toast } from 'sonner';
interface ContactTagPickerProps {
  companyId: string | undefined;
  selectedTags: string[];  // tag names stored on contact
  onToggle: (tagName: string) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
  /** Tag names (case-insensitive) hidden from chips + picker — controlled elsewhere (e.g. VIP switch). */
  tagsManagedElsewhere?: string[];
}

function isManagedElsewhere(name: string, managed?: string[]): boolean {
  if (!managed?.length) return false;
  const up = name.toUpperCase();
  return managed.some((m) => m.toUpperCase() === up);
}

export function ContactTagPicker({ companyId, selectedTags, onToggle, readonly, size = 'md', tagsManagedElsewhere }: ContactTagPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: tags = [] } = useContactTags(companyId);
  const createTag = useCreateContactTag();
  const deleteTag = useDeleteContactTag();
const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PALETTE[7]); // blue default
  const [showManage, setShowManage] = useState(false);

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name || !companyId) return;
    if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error(isRu ? 'Тег уже существует' : 'Tag already exists');
      return;
    }
    try {
      await createTag.mutateAsync({ company_id: companyId, name, color: newTagColor });
      onToggle(name); // auto-select the new tag
      setNewTagName('');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDeleteTag = async (tag: ContactTag) => {
    try {
      await deleteTag.mutateAsync(tag.id);
      // If it was selected, remove it
      if (selectedTags.includes(tag.name)) {
        onToggle(tag.name);
      }
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const getTagColor = (name: string): string => {
    const found = tags.find(t => t.name === name);
    return found?.color || 'hsl(var(--muted-foreground))';
  };

  const sizeClasses = size === 'sm'
    ? 'text-[10px] h-5 px-1.5'
    : 'text-xs h-6 px-2';

  if (readonly) {
    if (!selectedTags?.length) return null;
    const visibleReadonly = selectedTags.filter((n) => !isManagedElsewhere(n, tagsManagedElsewhere));
    if (!visibleReadonly.length) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {visibleReadonly.map(name => (
          <Badge
            key={name}
            variant="outline"
            className={cn(sizeClasses, 'border font-medium')}
            style={{
              backgroundColor: `${getTagColor(name)}15`,
              borderColor: `${getTagColor(name)}40`,
              color: getTagColor(name),
            }}
          >
            {name}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected tags (omit tagsManagedElsewhere — e.g. VIP from VIP switch) */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.filter((n) => !isManagedElsewhere(n, tagsManagedElsewhere)).map(name => (
          <Badge
            key={name}
            variant="outline"
            className={cn(sizeClasses, 'border font-medium gap-1 cursor-pointer')}
            style={{
              backgroundColor: `${getTagColor(name)}15`,
              borderColor: `${getTagColor(name)}40`,
              color: getTagColor(name),
            }}
            onClick={() => onToggle(name)}
          >
            {name}
            <X className="h-3 w-3 opacity-60 hover:opacity-100" />
          </Badge>
        ))}

        {/* Add tag button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              'inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30',
              'text-muted-foreground hover:border-primary hover:text-primary transition-colors',
              sizeClasses, 'cursor-pointer'
            )}>
              <Plus className="h-3 w-3" />
              <span>{isRu ? 'Тег' : 'Tag'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 z-[999]" align="start">
            {showManage ? (
              <ManageView
                tags={tags}
                onDelete={handleDeleteTag}
                onBack={() => setShowManage(false)}
                isRu={isRu}
              />
            ) : (
              <div className="p-2 space-y-2">
                {/* Existing tags */}
                {tags.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {tags.filter((tag) => !isManagedElsewhere(tag.name, tagsManagedElsewhere)).map(tag => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => onToggle(tag.name)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-none hover:bg-muted text-sm text-left"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 truncate">{tag.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Divider */}
                {tags.length > 0 && <div className="border-t" />}

                {/* Create new tag */}
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder={isRu ? 'Новый тег...' : 'New tag...'}
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); }
                      }}
                      className="h-7 text-xs flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={!newTagName.trim() || createTag.isPending}
                      onClick={handleCreateTag}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Color picker */}
                  <div className="flex flex-wrap gap-1">
                    {TAG_COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-transform',
                          newTagColor === color ? 'border-foreground scale-110' : 'border-transparent '
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Manage link */}
                {tags.length > 0 && (
                  <>
                    <div className="border-t" />
                    <button
                      onClick={() => setShowManage(true)}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground w-full"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      {isRu ? 'Управление тегами' : 'Manage tags'}
                    </button>
                  </>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function ManageView({ tags, onDelete, onBack, isRu }: {
  tags: ContactTag[];
  onDelete: (tag: ContactTag) => void;
  onBack: () => void;
  isRu: boolean;
}) {
  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium">{isRu ? 'Управление тегами' : 'Manage Tags'}</span>
        <button onClick={onBack} className="text-xs text-primary hover:underline">
          {isRu ? 'Назад' : 'Back'}
        </button>
      </div>
      <div className="max-h-52 overflow-y-auto space-y-0.5">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded-none hover:bg-muted group">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <span className="flex-1 text-sm truncate">{tag.name}</span>
            <button
              onClick={() => onDelete(tag)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple display-only component for tags in list cards */
export function ContactTagsDisplay({ tags, companyId, max = 3 }: { tags: string[]; companyId?: string; max?: number }) {
  const { data: allTags = [] } = useContactTags(companyId);
  if (!tags?.length) return null;

  const shown = tags.slice(0, max);
  const remaining = tags.length - max;

  const getColor = (name: string) => allTags.find(t => t.name === name)?.color || 'hsl(var(--muted-foreground))';

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(name => (
        <span
          key={name}
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: `${getColor(name)}15`,
            color: getColor(name),
          }}
        >
          {name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
}
