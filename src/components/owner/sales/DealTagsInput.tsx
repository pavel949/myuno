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
  'bg-info/10 text-info border-info/30',
  'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
  'bg-success/10 text-success border-success/30',
  'bg-warning/10 text-warning border-warning/30',
  'bg-destructive/10 text-destructive border-destructive/30',
  'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
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
