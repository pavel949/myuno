import React from 'react';

interface ServiceBilingualHintProps {
  isRu: boolean;
  className?: string;
}

/**
 * Shared reminder for vendor + admin service forms: both EN and RU fields
 * surface in the catalog and SEO landings.
 */
export function ServiceBilingualHint({ isRu, className }: ServiceBilingualHintProps) {
  return (
    <p
      role="note"
      className={`text-[12px] leading-snug text-muted-foreground border border-border/50 bg-muted/20 px-3 py-2 ${className ?? ''}`}
    >
      {isRu
        ? 'Заполните название и описание на русском и английском — так услуга корректно покажется в каталоге и на лендингах.'
        : 'Fill name and description in both English and Russian so the listing appears correctly in the catalogue and landing pages.'}
    </p>
  );
}
