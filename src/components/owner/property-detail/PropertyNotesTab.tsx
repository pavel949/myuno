import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyNotes, NoteCategory, noteCategoryLabels } from '@/hooks/usePropertyNotes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pin, PinOff, Trash2, StickyNote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru as ruLocale } from 'date-fns/locale';

interface PropertyNotesTabProps {
  propertyId: string;
}

export function PropertyNotesTab({ propertyId }: PropertyNotesTabProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { notes, isLoading, addNote, deleteNote, togglePin } = usePropertyNotes(propertyId);

  const [isAdding, setIsAdding] = useState(false);
  const [text, setText] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');

  const handleAdd = async () => {
    if (!text.trim()) return;
    try {
      await addNote.mutateAsync({ note: text.trim(), category });
      setText('');
      setCategory('general');
      setIsAdding(false);
      toast.success(isRu ? 'Заметка добавлена' : 'Note added');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRu ? 'Удалить заметку?' : 'Delete note?')) return;
    await deleteNote.mutateAsync(id);
  };

  if (isLoading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <div className="space-y-4">
      {/* Add note */}
      {isAdding ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={isRu ? 'Внутренняя заметка...' : 'Internal note...'}
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(noteCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {isRu ? label.ru : label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setText(''); }}>
                  {isRu ? 'Отмена' : 'Cancel'}
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={addNote.isPending || !text.trim()}>
                  {addNote.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {isRu ? 'Сохранить' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить заметку' : 'Add Note'}
        </Button>
      )}

      {/* Notes list */}
      {!notes?.length && !isAdding ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{isRu ? 'Нет заметок' : 'No notes yet'}</p>
          <p className="text-sm mt-1">{isRu ? 'Добавьте внутренние пометки для команды' : 'Add internal notes for your team'}</p>
        </div>
      ) : (
        notes?.map((note) => {
          const catLabel = noteCategoryLabels[note.category as NoteCategory] || noteCategoryLabels.general;
          return (
            <Card key={note.id} className={note.is_pinned ? 'border-primary/30 bg-primary/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${catLabel.color}`}>
                        {isRu ? catLabel.ru : catLabel.en}
                      </Badge>
                      {note.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: isRu ? ruLocale : undefined })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => togglePin.mutate({ id: note.id, is_pinned: !note.is_pinned })}
                    >
                      {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
