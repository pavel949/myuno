/**
 * VoiceInputButton — reusable mic button that records audio and returns
 * the transcript via `onTranscript`. Uses Lovable AI (openai/gpt-4o-mini-transcribe).
 *
 * Usage:
 *   <VoiceInputButton onTranscript={(text) => setMessage((prev) => appendText(prev, text))} />
 *
 * The consumer decides how to insert the returned text (append vs replace).
 * Import `appendTranscript` for the standard append-with-space behaviour.
 */
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceTranscription } from '@/hooks/useVoiceTranscription';
import { toast } from 'sonner';

export interface VoiceInputButtonProps
  extends Omit<ButtonProps, 'onClick' | 'children' | 'type'> {
  onTranscript: (text: string) => void;
  language?: string;
  labelIdle?: string;
  labelRecording?: string;
  labelTranscribing?: string;
}

export function VoiceInputButton({
  onTranscript,
  language,
  labelIdle,
  labelRecording,
  labelTranscribing,
  className,
  size = 'icon',
  variant = 'ghost',
  disabled,
  ...rest
}: VoiceInputButtonProps) {
  const { language: uiLang } = useLanguage();
  const isRu = uiLang === 'ru';

  const { isRecording, isTranscribing, isSupported, toggle } = useVoiceTranscription({
    language,
    onTranscript,
    onError: (msg) => {
      const localized =
        msg === 'Microphone access denied'
          ? isRu
            ? 'Разрешите доступ к микрофону в настройках браузера'
            : 'Please allow microphone access in your browser'
          : msg === 'Recording was empty. Please try again.'
          ? isRu
            ? 'Запись пустая — попробуйте ещё раз'
            : 'Recording was empty — please try again'
          : msg === 'Empty transcript'
          ? isRu
            ? 'Не удалось распознать речь'
            : 'Could not transcribe speech'
          : msg;
      toast.error(localized);
    },
  });

  if (!isSupported) return null;

  const idleLabel = labelIdle ?? (isRu ? 'Записать голосом' : 'Record voice');
  const recLabel = labelRecording ?? (isRu ? 'Остановить запись' : 'Stop recording');
  const transLabel = labelTranscribing ?? (isRu ? 'Распознаём…' : 'Transcribing…');

  const label = isRecording ? recLabel : isTranscribing ? transLabel : idleLabel;

  const isBusy = isRecording || isTranscribing;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={toggle}
      disabled={disabled || isTranscribing}
      aria-label={label}
      aria-pressed={isRecording}
      aria-busy={isBusy}
      title={label}
      data-state={isTranscribing ? 'transcribing' : isRecording ? 'recording' : 'idle'}
      className={cn(
        'relative shrink-0 transition-colors',
        isRecording && 'text-destructive ring-2 ring-destructive/60 ring-offset-1 ring-offset-background',
        isTranscribing && 'cursor-wait opacity-90',
        className,
      )}
      {...rest}
    >
      {isRecording && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-[inherit] bg-destructive/20 animate-ping"
        />
      )}
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <Square className="relative h-3.5 w-3.5 fill-current" />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive animate-pulse"
          />
          <span className="sr-only" role="status" aria-live="polite">
            {recLabel}
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isTranscribing && (
        <span className="sr-only" role="status" aria-live="polite">
          {transLabel}
        </span>
      )}
    </Button>
  );
}

/** Append transcript to existing text with a single space separator. */
export function appendTranscript(prev: string, addition: string): string {
  const base = (prev ?? '').trimEnd();
  const add = (addition ?? '').trim();
  if (!add) return prev ?? '';
  if (!base) return add;
  return `${base} ${add}`;
}
