/**
 * @module use-toast
 * @description Thin adapter over sonner's toast API.
 * 
 * Maintains backward-compatible `useToast()` / `toast()` interface
 * so existing call-sites (`toast({ title, description, variant })`) 
 * keep working without changes.
 * 
 * The shadcn <Toaster /> component and its reducer/listener machinery
 * have been removed. Only the <Sonner /> component in App.tsx is needed.
 */

import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
  [key: string]: unknown;
}

function toast(opts: ToastOptions) {
  const message = opts.title ?? '';
  const options: Parameters<typeof sonnerToast>[1] = {
    description: opts.description,
    action: opts.action as any,
  };

  if (opts.variant === 'destructive') {
    sonnerToast.error(message, options);
  } else {
    sonnerToast(message, options);
  }
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] as any[],          // Backward compat – no-op array
  };
}

export { useToast, toast };
