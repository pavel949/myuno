import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

/** Unknown availability must never look like an empty, fully open calendar. */
export function AvailabilityStatus({ loading, error, onRetry }: { loading: boolean; error: boolean; onRetry: () => void }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  if (error) return <div role="alert" className="space-y-2 border border-border bg-muted/40 p-3 text-sm">
    <p>{ru ? 'Не удалось проверить занятость. Свободные даты пока неизвестны.' : 'Availability could not be checked. Free dates are currently unknown.'}</p>
    <Button type="button" variant="outline" onClick={onRetry}>{ru ? 'Повторить' : 'Retry'}</Button>
  </div>;
  if (loading) return <p role="status" className="p-3 text-sm text-muted-foreground">{ru ? 'Проверяем занятость…' : 'Checking availability…'}</p>;
  return null;
}
