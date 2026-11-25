import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { parseIntakePaths } from '../../../../supabase/functions/_shared/intake-private-contract';

export function IntakePrivateFiles({ paths }: { paths?: string[] }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const [busy, setBusy] = useState(false);
  if (!paths?.length) return null;
  const download = async (path: string) => {
    setBusy(true);
    try {
      const { data: actor, error: authError } = await supabase.auth.getUser();
      if (authError || !actor.user) throw new Error('Authentication required');
      const [checked] = parseIntakePaths(actor.user.id, [path], true);
      const { data: blob, error } = await supabase.storage.from('intake-uploads').download(checked);
      if (error || !blob) throw new Error('File unavailable');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'intake-original.' + checked.split('.').pop();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(ru ? 'Нет доступа к исходному файлу' : 'Original file is unavailable');
    } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {paths.map((path, index) => (
        <Button key={path} variant="outline" size="sm" disabled={busy} onClick={event => { event.stopPropagation(); void download(path); }}>
          <Download className="h-4 w-4 mr-1" />{ru ? 'Исходный файл' : 'Original file'} {index + 1}
        </Button>
      ))}
    </div>
  );
}
