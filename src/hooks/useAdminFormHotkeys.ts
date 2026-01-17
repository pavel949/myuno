import { useEffect, useCallback, useRef } from 'react';

interface UseAdminFormHotkeysOptions {
  onSave: () => void | Promise<void>;
  onClose: () => void;
  isDialogOpen: boolean;
  isSubmitting?: boolean;
}

export function useAdminFormHotkeys({
  onSave,
  onClose,
  isDialogOpen,
  isSubmitting = false,
}: UseAdminFormHotkeysOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isDialogOpen) return;

    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (!isSubmitting) {
        onSave();
      }
    }

    // Escape to close (only when not in textarea)
    if (e.key === 'Escape') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        onClose();
      }
    }
  }, [isDialogOpen, isSubmitting, onSave, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for tracking form completion progress
export function useFormProgress<T extends Record<string, any>>(
  formData: T,
  requiredFields: (keyof T)[],
  optionalFields: (keyof T)[] = []
): { progress: number; filled: number; total: number } {
  const allFields = [...requiredFields, ...optionalFields];
  
  const filled = allFields.filter((field) => {
    const value = formData[field];
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'boolean') return true; // booleans are always "filled"
    return value !== null && value !== undefined;
  }).length;

  return {
    progress: Math.round((filled / allFields.length) * 100),
    filled,
    total: allFields.length,
  };
}
