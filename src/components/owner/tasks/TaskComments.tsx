import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaskComments, useAddTaskComment } from '@/hooks/useTaskComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Send, MessageSquare } from 'lucide-react';

interface Props {
  taskId: string;
  taskSource: 'crm' | 'ops';
}

export function TaskComments({ taskId, taskSource }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => isRu ? ru : en;

  const { data: comments = [], isLoading } = useTaskComments(taskId, taskSource);
  const addComment = useAddTaskComment();
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    try {
      await addComment.mutateAsync({ task_id: taskId, task_source: taskSource, content: text.trim() });
      setText('');
    } catch {
      toast.error(t('Failed to add comment', 'Ошибка добавления'));
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5" />
        {t('Comments', 'Комментарии')}
        {comments.length > 0 && <span className="text-xs text-muted-foreground">({comments.length})</span>}
      </h4>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map(c => {
            const initials = (c.author_name || 'U').slice(0, 2).toUpperCase();
            return (
              <div key={c.id} className="flex gap-2">
                <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px] bg-secondary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{c.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: isRu ? ru : undefined })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('No comments yet', 'Комментариев пока нет')}</p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t('Add comment...', 'Добавить комментарий...')}
          rows={1}
          className="min-h-[36px] text-sm"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        />
        <Button size="icon" variant="ghost" onClick={handleSubmit} disabled={!text.trim() || addComment.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
