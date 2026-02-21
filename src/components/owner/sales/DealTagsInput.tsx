import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  readonly?: boolean;
}

const TAG_COLORS = [
  'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30',
  'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function DealTagsDisplay({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(t => (
        <Badge key={t} variant="outline" className={cn('text-[9px] h-4 px-1.5 border', tagColor(t))}>
          {t}
        </Badge>
      ))}
    </div>
  );
}

export function DealTagsInput({ tags, onChange, readonly }: Props) {
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
    setShowInput(false);
  };

  if (readonly) return <DealTagsDisplay tags={tags} />;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map(t => (
        <Badge key={t} variant="outline" className={cn('text-[10px] h-5 px-1.5 border gap-1', tagColor(t))}>
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-destructive">
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      {showInput ? (
        <Input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            if (e.key === 'Escape') { setShowInput(false); setInput(''); }
          }}
          onBlur={addTag}
          className="h-6 w-24 text-xs px-2"
          placeholder="tag..."
        />
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="h-5 px-1.5 rounded border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary text-[10px] flex items-center gap-0.5"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
