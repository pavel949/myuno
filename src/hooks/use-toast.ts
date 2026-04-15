/**
 * Thin adapter: shadcn-style `toast({ title, variant })` backed by sonner (app-wide toast).
 */
import { toast as sonnerToast } from 'sonner';

export type ToastPayload = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

function showToast({ title, description, variant }: ToastPayload) {
  const message = [title, description].filter(Boolean).join('\n') || '';
  if (variant === 'destructive') {
    sonnerToast.error(message || 'Error');
    return;
  }
  sonnerToast.success(message || 'OK');
}

export function useToast() {
  return { toast: showToast };
}
