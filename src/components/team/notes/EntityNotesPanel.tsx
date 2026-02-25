import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEntityNotes, type EntityType } from '@/hooks/useEntityNotes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  StickyNote, Plus, AlertTriangle, Trash2, Edit2,
  Loader2, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface AddNoteFormProps {
  onSubmit: (content: string, isImportant: boolean) => Promise<void>;
  isSubmitting: boolean;
}

function AddNoteForm({ onSubmit, isSubmitting }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content.trim(), isImportant);
    setContent('');
    setIsImportant(false);
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isRu ? 'Добавить заметку...' : 'Add a note...'}
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="important" 
            checked={isImportant}
            onCheckedChange={(checked) => setIsImportant(!!checked)}
          />
          <label 
            htmlFor="important" 
            className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            {isRu ? 'Важное' : 'Important'}
          </label>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || isSubmitting}
          size="sm"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

interface NoteCardProps {
  note: {
    id: string;
    user_id: string;
    content: string;
    is_important: boolean;
    created_at: string;
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  isOwn: boolean;
  onDelete?: () => void;
}

function NoteCard({ note, isOwn, onDelete }: NoteCardProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'ru' ? ru : enUS;

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      note.is_important && "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
    )}>
      <div className="flex items-start gap-3">
        <Avatar className="h-7 w-7">
          <AvatarImage src={note.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">
            {note.author?.display_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {note.author?.display_name || 'Team Member'}
            </span>
            {note.is_important && (
              <Badge variant="outline" className="text-warning border-warning/30 text-[10px] px-1.5 py-0">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                !
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(note.created_at), { 
                addSuffix: true, 
                locale: dateLocale 
              })}
            </span>
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </div>

        {isOwn && onDelete && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface EntityNotesPanelProps {
  entityType: EntityType;
  entityId: string;
  className?: string;
  compact?: boolean;
}

/**
 * Panel for viewing and adding notes to any entity
 */
export function EntityNotesPanel({ 
  entityType, 
  entityId, 
  className,
  compact = false
}: EntityNotesPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { 
    notes, 
    importantNotes, 
    notesCount, 
    isLoading, 
    addNote, 
    isAdding,
    deleteNote 
  } = useEntityNotes(entityType, entityId);
  const isRu = language === 'ru';

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            {isRu ? 'Заметки' : 'Notes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (compact && notesCount === 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className={cn("gap-1.5", className)}
      >
        <Plus className="h-3.5 w-3.5" />
        {isRu ? 'Заметка' : 'Note'}
      </Button>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            {isRu ? 'Заметки команды' : 'Team Notes'}
          </span>
          {notesCount > 0 && (
            <Badge variant="secondary">{notesCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <AddNoteForm 
          onSubmit={async (content, isImportant) => {
            await addNote({ content, isImportant });
          }}
          isSubmitting={isAdding}
        />

        {/* Important Notes First */}
        {importantNotes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-warning flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {isRu ? 'Важные заметки' : 'Important Notes'}
            </p>
            {importantNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isOwn={note.user_id === user?.id}
                onDelete={() => deleteNote(note.id)}
              />
            ))}
          </div>
        )}

        {/* All Notes */}
        {notes && notes.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {notes.filter(n => !n.is_important).map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isOwn={note.user_id === user?.id}
                  onDelete={() => deleteNote(note.id)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {isRu ? 'Пока нет заметок' : 'No notes yet'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Small badge showing notes count
 */
export function NotesBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("gap-1 text-xs", className)}
    >
      <StickyNote className="h-3 w-3" />
      {count}
    </Badge>
  );
}
